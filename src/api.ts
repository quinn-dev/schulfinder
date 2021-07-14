import got from 'got'
import {
	object,
	boolean,
	array,
	number,
	string,
	any,
	assert,
	nullable
} from 'superstruct'
import ora from 'ora'
import enquirer from 'enquirer'
import pMap from 'p-map'
import {District, SimpleSchool, DetailedSchool} from './types.js'
import {quit, quitWithError} from './cli.js'

const baseURL = 'https://schulfinder.kultus-bw.de/api/'

const api = got.extend({
	prefixUrl: baseURL,
	responseType: 'json',
	resolveBodyOnly: true,
	retry: {
		limit: 10
	},
	timeout: 3000
})

export const getDistricts = async (quiet = false) => {
	const spinner = ora('Looking up districts')

	if (!quiet) {
		spinner.start()
	}

	const endpoint = 'admin_units/5/?query=&wildcard=true'

	const ExpectedResponse = object({
		success: boolean(),
		results: array(
			object({
				name: string(),
				value: number()
			})
		)
	})

	const districts = await api.get(endpoint)
		.then(response => {
			assert(response, ExpectedResponse)

			const {success, results} = response

			if (success) {
				return results.map(({name, value}) => ({
					district: name,
					value
				}))
			}

			throw new Error(
				`Couldn't fetch districts: Received ${JSON.stringify(response)}`
			)
		})

	if (!quiet) {
		spinner.succeed()
	}

	return districts
}

export const getSchools = async (parameters: string | Record<string, string | number | boolean | null | undefined>): Promise<SimpleSchool[]> => {
	const endpoint = 'schools'

	const ExpectedResponse = array(
		object({
			uuid: string(),
			outpost_number: string(),
			name: string(),
			city: string(),
			lat: number(),
			lng: number(),
			official: number(),
			marker_class: string(),
			marker_label: string(),
			website: nullable(string())
		})
	)

	const response = await api.get(endpoint, {
		searchParams: parameters
	})

	assert(response, ExpectedResponse)

	return response
}

export const getSchoolsByURL = async (url: string, froide = false, quiet = false) => {
	const spinner = ora()

	if (!(new URL(url).hostname === 'schulfinder.kultus-bw.de')) {
		quitWithError(`Invalid URL: ${url}`)
	}

	url = url.trim()

	const base64String = new URL(url).searchParams.get('q')

	if (base64String === null) {
		throw new Error(`Invalid URL: ${url}`)
	} else {
		const queryString = Buffer.from(base64String, 'base64').toString('utf-8')

		if (froide && new URLSearchParams(queryString).get('outposts') === '1') {
			spinner.warn('You have included outposts in your query. Importing outposts into Froide is highly discouraged.')

			const answer: {continue: boolean} = await enquirer.prompt({
				type: 'confirm',
				name: 'continue',
				message: 'Do you want to continue?',
				format: value => value ? 'yes' : 'no'
			})

			if (!answer.continue) {
				spinner.fail('Aborted')
				quit(1)
			}
		}

		if (!quiet) {
			spinner.start('Loading school list')
		}

		const schools = await getSchools(queryString)

		if (!quiet) {
			spinner.succeed()
		}

		return schools
	}
}

export const getSchoolsByDistricts = async (districts: District[], quiet = false) => {
	const spinner = ora('Loading school lists')

	if (!quiet) {
		spinner.start()
	}

	const schoolsWithoutDetails: SimpleSchool[] = []
	let districtCounter = 1

	await pMap(districts, async ({district, value}) => {
		const schoolsByDistrict = await getSchools({district: value})
		schoolsWithoutDetails.push(...schoolsByDistrict)

		spinner.text = `Loading school list: ${district} (${districtCounter}/${districts.length})`

		districtCounter += 1
	})

	if (!quiet) {
		spinner.succeed(`Loading school lists (${districts.length}/${districts.length})`)
	}

	return schoolsWithoutDetails
}

export const getSchoolDetails = async (uuid: string): Promise<DetailedSchool> => {
	const endpoint = 'school'

	const ExpectedResponse = object({
		outpost_number: string(),
		name: string(),
		street: nullable(string()),
		house_number: nullable(string()),
		postcode: nullable(string()),
		city: nullable(string()),
		phone: nullable(string()),
		fax: nullable(string()),
		email: nullable(string()),
		website: nullable(string()),
		tablet_tranche: any(),
		tablet_platform: any(),
		tablet_branches: any(),
		tablet_trades: any(),
		lat: number(),
		lng: number(),
		official: number(),
		branches: array(
			object({
				branch_id: number(),
				acronym: string(),
				description_long: string()
			})
		),
		trades: array()
	})

	const response = await api.get(endpoint, {
		searchParams: {uuid}
	})

	assert(response, ExpectedResponse)

	return response
}

export const getMultipleSchoolDetails = async (schools: SimpleSchool[], quiet = false) => {
	const spinner = ora('Fetching school data')

	if (!quiet) {
		spinner.start()
	}

	const schoolsWithDetails: DetailedSchool[] = []

	await pMap(schools, async ({uuid}: SimpleSchool) => {
		const school = await getSchoolDetails(uuid)
		schoolsWithDetails.push(school)

		spinner.text = `Fetching school data (${schoolsWithDetails.length}/${schools.length})`
	}, {concurrency: 300})

	if (!quiet) {
		spinner.succeed()
	}

	return schoolsWithDetails
}

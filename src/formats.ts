import parsePhoneNumber from 'libphonenumber-js'
import isEmail from 'validator/lib/isEmail.js'
import {DetailedSchool, Branch} from './types.js'

const classifications = new Map([
	['B', 'Berufliche Schule'],
	['GM', 'Gemeinschaftsschule'],
	['G', 'Grundschule'],
	['GY', 'Gymnasium'],
	['R', 'Realschule'],
	['S', 'Förderschule'],
	['WR', 'Werkrealschule']
])

const vocationalSchools = [
	{
		name: 'Berufliches Gymnasium',
		match: [
			/berufliches\s+gymnasium/i
		]
	},
	{
		name: 'Berufsfachschule',
		match: [
			/berufsfachschule/i
		]
	},
	{
		name: 'Berufskolleg',
		match: [
			/berufskolleg/i
		]
	},
	{
		name: 'Berufsoberschule',
		match: [
			/berufsoberschule/i
		]
	},
	{
		name: 'Berufsschule',
		match: [
			/berufsschule/i
		]
	},
	{
		name: 'Berufsvorbereitender Bildungsgang',
		match: [
			/vorqualifizierungsjahr/i,
			/berufseinstiegsjahr/i,
			/ausbildungsvorbereitung/i
		]
	},
	{
		name: 'Fachschule',
		match: [
			/fachschule/i
		]
	}
]

const getClassification = (types: string[], branches: Branch[]) => {
	const acronyms = branches.map(({acronym}) => acronym)

	const abendschulen = new Set(['ABGY', 'ARS'])

	if (acronyms.length > 0 && acronyms.filter(acronym => !abendschulen.has(acronym)).length === 0) {
		return 'Abendschule'
	}

	if (types.length > 1) {
		return 'Schule'
	}

	const classification = classifications.get(types[0])

	if (!classification) {
		return 'Schule'
	}

	const unique = (array: any[]) => array.filter((subtype, index, array) => array.indexOf(subtype) === index)

	if (classification === 'Berufliche Schule') {
		const subtypes = unique(branches.map(({description_long}) => {
			for (const {name, match} of vocationalSchools) {
				for (const regex of match) {
					if (regex.test(description_long)) {
						return name
					}
				}
			}

			return 'Berufliche Schule'
		}))

		return subtypes.length === 1 ? subtypes[0] : 'Berufliche Schule'
	}

	return classification
}

export const formatToFroide = (schools: DetailedSchool[]) => {
	return schools.map(({
		name,
		street,
		house_number,
		postcode,
		city,
		phone,
		fax,
		email,
		website,
		types,
		branches
	}) => {
		const problems: string[] = []

		if (street === null) {
			problems.push('Missing street name')
		}

		if (house_number === null) {
			problems.push('Missing house number')
		}

		if (postcode === null) {
			problems.push('Missing postcode')
		}

		if (city === null) {
			problems.push('Missing city')
		}

		if (phone && !parsePhoneNumber(phone, 'DE')?.isValid()) {
			problems.push('Invalid phone number')
		}

		if (fax && !parsePhoneNumber(fax)?.isPossible()) {
			problems.push('Invalid fax number')
		}

		if (email === null) {
			problems.push('Missing email')
		} else if (!isEmail(email)) {
			problems.push('Invalid email')
		}

		const getPhoneNumber = () => {
			if (!phone) {
				return undefined
			}

			if (problems.includes('Invalid phone number')) {
				return `Telefon: ${phone}`
			}

			return `Telefon: ${parsePhoneNumber(phone, 'DE')?.formatInternational() ?? phone}`
		}

		return {
			name: city ? `${name} (${city})` : `${name}`,
			email,
			fax,
			contact: getPhoneNumber(),
			address: `${street ?? ''} ${house_number ?? ''}\n${postcode ?? ''} ${city ?? ''}`,
			url: website,
			classification: getClassification(types, branches),
			jurisdiction__slug: 'baden-wuerttemberg',
			categories: 'Schule',
			problems: problems.join(' / ')
		}
	})
}

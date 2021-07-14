#!/usr/bin/env node
import meow from 'meow'
import chalk from 'chalk'
import {writeFileSync} from 'fs'
import papaparse from 'papaparse'
import ora from 'ora'
import {
	getDistricts,
	getSchoolsByDistricts,
	getMultipleSchoolDetails,
	getSchoolsByURL
} from './api.js'
import {formatToFroide} from './formats.js'

export const quit = (statusCode: number) => process.exit(statusCode)

const {unparse} = papaparse

const cli = meow(`
	Usage
	  $ schulfinder <file>

	Options
	  -u, --url=<url>        Specify selection criteria by link generated through web interface
	  -f, --froide           Use froide's public bodies format (for Frag den Staat)
	  -p, --problems=<file>  Save schools with problems, if any, into seperate file (requires --froide)
	  -q, --quiet            Show only errors
`, {
	importMeta: import.meta,
	flags: {
		url: {
			type: 'string',
			alias: 'u'
		},
		froide: {
			type: 'boolean',
			alias: 'f'
		},
		problems: {
			type: 'string',
			alias: 'p'
		},
		quiet: {
			type: 'boolean',
			alias: 'q'
		},
		help: {
			type: 'boolean',
			alias: 'h'
		}
	}
})

export const quitWithError = (message: string) => {
	console.log(chalk.bold(`  ${chalk.white.bgRedBright('Error')} - ${message}`))
	cli.showHelp(1)
}

(async () => {
	const {input, flags: options, showHelp} = cli

	if (options.help) {
		showHelp(0)
	}

	if (input.length === 0) {
		showHelp(0)
	} else if (input.length > 1) {
		quitWithError('Too many arguments.')
	}

	const outputFile = input[0]

	if (!options.froide && options.problems) {
		quitWithError('Option `--problems` requires `--froide`')
	}

	let schoolsWithoutDetails

	if (options.url) {
		schoolsWithoutDetails = await getSchoolsByURL(options.url, options.froide, options.quiet)
	} else {
		const districts = await getDistricts(options.quiet)
		schoolsWithoutDetails = await getSchoolsByDistricts(districts, options.quiet)
	}

	const schoolsWithDetails = await getMultipleSchoolDetails(schoolsWithoutDetails, options.quiet)

	const spinner = ora()

	if (!options.quiet) {
		spinner.start('Saving school data')
	}

	let problemCount = 0

	if (options.froide) {
		const formattedSchools = formatToFroide(schoolsWithDetails)

		problemCount = formattedSchools.filter(school => school.problems).length

		if (options.problems && problemCount) {
			const schoolsWithProblems = []
			const schoolsWithoutProblems = []

			for (const school of formattedSchools) {
				const {problems, ...rest} = school

				if (problems) {
					schoolsWithProblems.push(school)
				} else {
					schoolsWithoutProblems.push(rest)
				}
			}

			writeFileSync(outputFile, unparse(schoolsWithoutProblems))
			writeFileSync(options.problems, unparse(schoolsWithProblems))
		} else if (problemCount === 0) {
			writeFileSync(outputFile, unparse(formattedSchools.map(({problems, ...rest}) => rest)))
		} else {
			writeFileSync(outputFile, unparse(formattedSchools))
		}
	} else {
		writeFileSync(outputFile, JSON.stringify(schoolsWithDetails))
	}

	if (!options.quiet) {
		spinner.succeed()

		if (problemCount) {
			spinner.warn(`Found ${problemCount} schools with problems. Please review manually.`)
		}
	}
})()

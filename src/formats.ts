import parsePhoneNumber from 'libphonenumber-js'
import isEmail from 'validator/lib/isEmail.js'
import {DetailedSchool} from './types.js'

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

		/* If a school only has Gymnasien or is named Gymnasium, return 'Gymnasium'
		   Otherwise return 'Schule'
		*/
		const getClassification = () => {
			const acronyms = [
				'PROG',    'G8',  'SGGG',
				'SGGS',    'WGF', 'WGW',
				'TGG',     'TGI', 'TGM',
				'TGU',     'WGI', 'G9',
				'BTG',     'EG',  'TGT',
				'TGTM',    '6TG', '6WG',
				'TGE',     'TGN', '6ESG',
				'AG',      'GA3', 'GA7',
				'FHOEGYM'
			]

			const isGymnasium = ({acronym, description_long}: {acronym: string, description_long: string}) => {
				if (acronyms.includes(acronym)) {
					return true
				}

				if(/[gG]ymnasium/.test(description_long)) {
					return true
				}

				return false
			}

			if (/[gG]ymnasium/.test(name)) {
				return 'Gymnasium'
			}

			let gymnasien = 0
			let otherSchools = 0

			for (const branch of branches) {
				if (isGymnasium(branch)) {
					gymnasien += 1
				} else {
					otherSchools += 1
				}
			}

			if (gymnasien > 0 && otherSchools === 0) {
				return 'Gymnasium'
			}

			return 'Schule'
		}

		return {
			name: city ? `${name} (${city})` : `${name}`,
			email,
			fax,
			contact: getPhoneNumber(),
			address: `${street ?? ''} ${house_number ?? ''}\n${postcode ?? ''} ${city ?? ''}`,
			url: website,
			classification: getClassification(),
			jurisdiction__slug: 'baden-wuerttemberg',
			categories: 'Schule',
			problems: problems.join(' / ')
		}
	})
}

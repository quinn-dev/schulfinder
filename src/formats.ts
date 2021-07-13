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
		website
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
			classification: 'Schule',
			jurisdiction__slug: 'baden-wuerttemberg',
			categories: 'Schule',
			problems: problems.join(' / ')
		}
	})
}

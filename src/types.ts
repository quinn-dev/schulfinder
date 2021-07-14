export interface District {
	district: string;
	value: number;
}

export interface SimpleSchool {
	name: string;
	uuid: string;
	outpost_number: string;
	city: string;
	lat: number;
	lng: number;
	official: number;
	marker_class: string;
	marker_label: string;
	website: string | null;
}

export interface DetailedSchool {
	outpost_number: string;
	name: string;
	street: string | null;
	house_number: string | null;
	postcode: string | null;
	city: string | null;
	phone: string | null;
	fax: string | null;
	email: string | null;
	website: string | null;
	tablet_tranche?: unknown;
	tablet_platform?: unknown;
	tablet_branches?: unknown;
	tablet_trades?: unknown;
	lat: number;
	lng: number;
	official: number;
	branches: Array<{branch_id: number; acronym: string; description_long: string}>;
	trades: unknown[];
}

import { parse, stringify } from 'bcp-47';

export default (localeString: string) =>
	localeString ? stringify({ ...parse(localeString), language: 'und' }) : '';

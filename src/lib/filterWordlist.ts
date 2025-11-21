import iscJson from '$lib/indicSyllabicCategories.json';

const indicSyllabicCategories: { [key: string]: Set<number> } = Object.entries(
	iscJson as { [key: string]: number[] }
).reduce((acc, [key, value]) => ({ ...acc, [key]: new Set(value) }), {});

export default (wordlist: string[], filterSet: string[], negative = false): string[] =>
	wordlist.filter((word) =>
		negative
			? [...word]
					.map((c) => c.codePointAt(0) ?? -1)
					.every((cp) =>
						filterSet.every((iscFilter) => !indicSyllabicCategories[iscFilter].has(cp))
					)
			: [...word]
					.map((c) => c.codePointAt(0) ?? -1)
					.some((cp) => filterSet.some((iscFilter) => indicSyllabicCategories[iscFilter].has(cp)))
	);

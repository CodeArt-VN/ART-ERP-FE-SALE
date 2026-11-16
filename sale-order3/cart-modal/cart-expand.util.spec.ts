import {
	allCartLinesExpanded,
	pruneExpandedLineIds,
	toggleAllCartLinesExpanded,
	toggleExpandedLineId,
} from './cart-expand.util';

describe('cart-expand.util', () => {
	it('toggleExpandedLineId adds and removes', () => {
		expect(toggleExpandedLineId([], 5)).toEqual([5]);
		expect(toggleExpandedLineId([5, 7], 5)).toEqual([7]);
		expect(toggleExpandedLineId([5], 9)).toEqual([5, 9]);
	});

	it('allCartLinesExpanded requires every id', () => {
		expect(allCartLinesExpanded([1, 2], [])).toBe(false);
		expect(allCartLinesExpanded([1], [1, 2])).toBe(false);
		expect(allCartLinesExpanded([1, 2], [1, 2])).toBe(true);
	});

	it('toggleAllCartLinesExpanded expands or collapses', () => {
		expect(toggleAllCartLinesExpanded([], [3, 4])).toEqual([3, 4]);
		expect(toggleAllCartLinesExpanded([3, 4], [3, 4])).toEqual([]);
		expect(toggleAllCartLinesExpanded([3], [3, 4])).toEqual([3, 4]);
	});

	it('pruneExpandedLineIds drops removed lines', () => {
		expect(pruneExpandedLineIds([1, 2, 9], [1, 9])).toEqual([1, 9]);
	});
});

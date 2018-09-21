const assert = require('assert')
const tap = require('tap')
const LazyIterable = require('..')

const array = [1, 2, 3]
const other = [4, 5, 6]
const dupesArray = [1, 1, 2, 2, 3, 3]
const iterable = new LazyIterable(array)
const empty = new LazyIterable([])
const dupes = new LazyIterable(dupesArray)
const thisArg = {}

function * generator () {
	yield * array
}

const none = v => v > 3
const one = v => v > 2
const some = v => v > 1
const all = v => v > 0

const withIndex = callback => {
	let index = 0
	return (v, i) => {
		assert.strictEqual(i, index++)
		return callback(v)
	}
}

const withSource = (callback, source) => {
	return (v, _i, s) => {
		assert.strictEqual(s, source)
		return callback(v)
	}
}

const withThisArg = (callback, thisArg) => {
	return function fn (v) {
		assert.strictEqual(this, thisArg)
		return callback(v)
	}
}

tap.test('new', t => {
	t.strictSame(Array.from(new LazyIterable(array)), array, 'Iterable')
	t.strictSame(Array.from(new LazyIterable(generator)), Array.from(generator()), 'function*')
	t.strictSame(Array.from(new LazyIterable(generator())), Array.from(generator()), 'Generator')
	t.throws(() => { new LazyIterable(null) }, 'null') // eslint-disable-line no-new
	t.throws(() => { new LazyIterable({}) }, '{}') // eslint-disable-line no-new
	t.end()
})

tap.test('from', t => {
	t.strictSame(Array.from(LazyIterable.from(array)), array, 'values')
	t.strictSame(Array.from(LazyIterable.from(empty)), [], 'empty')
	t.end()
})

tap.test('@@iterator', t => {
	t.strictSame(Array.from(iterable), array, 'values')
	t.strictSame(Array.from(empty), [], 'empty')
	t.end()
})

tap.test('length', t => {
	t.equal(iterable.length, array.length, 'values')
	t.equal(empty.length, 0, 'empty')
	t.end()
})

tap.test('concat', t => {
	t.strictSame(Array.from(iterable.concat(other)), array.concat(other), 'Iterable')
	t.strictSame(Array.from(iterable.concat(other[0])), array.concat(other[0]), 'value')
	t.strictSame(Array.from(iterable.concat(other, other)), array.concat(other, other), 'Iterable, Iterable')
	t.strictSame(Array.from(iterable.concat(other, other[0])), array.concat(other, other[0]), 'Iterable, value')
	t.strictSame(Array.from(iterable.concat([])), array.concat([]), 'empty')
	t.strictSame(Array.from(empty.concat(other)), [].concat(other), 'empty source')
	t.end()
})

tap.test('entries', t => {
	t.strictSame(Array.from(iterable.entries()), Array.from(array.entries()), 'values')
	t.strictSame(Array.from(empty.entries()), Array.from([].entries()), 'empty')
	t.end()
})

tap.test('every', t => {
	t.equal(iterable.every(none), false, 'none')
	t.equal(iterable.every(one), false, 'one')
	t.equal(iterable.every(some), false, 'some')
	t.equal(iterable.every(all), true, 'all')
	t.equal(empty.every(all), true, 'empty')
	t.equal(iterable.every(withIndex(some)), false, 'index')
	t.equal(iterable.every(withSource(some, iterable)), false, 'iterable')
	t.equal(iterable.every(withThisArg(some, thisArg), thisArg), false, 'thisArg')
	t.end()
})

tap.test('filter', t => {
	function test (name, actualPredicate, expectedPredicate = actualPredicate, useThisArg = false) {
		t.strictSame(Array.from(iterable.filter(actualPredicate, useThisArg ? thisArg : undefined)), array.filter(expectedPredicate), name)
	}

	test('none', none)
	test('one', one)
	test('some', some)
	test('all', all)
	t.strictSame(Array.from(empty.filter(some)), [].filter(some), 'empty')
	test('index', withIndex(some), some)
	test('source', withSource(some, iterable), some)
	test('thisArg', withThisArg(some, thisArg), some, true)
	t.end()
})

tap.test('find', t => {
	function test (name, actualPredicate, expectedPredicate = actualPredicate, useThisArg = false) {
		t.equal(iterable.find(actualPredicate, useThisArg ? thisArg : undefined), array.find(expectedPredicate), name)
	}

	test('none', none)
	test('one', one)
	test('some', some)
	test('all', all)
	t.equal(empty.find(some), [].find(some), 'empty')
	test('index', withIndex(some), some)
	test('source', withSource(some, iterable), some)
	test('thisArg', withThisArg(some, thisArg), some, true)
	t.end()
})

tap.test('findIndex', t => {
	function test (name, actualPredicate, expectedPredicate = actualPredicate, useThisArg = false) {
		t.equal(iterable.findIndex(actualPredicate, useThisArg ? thisArg : undefined), array.findIndex(expectedPredicate), name)
	}

	test('none', none)
	test('one', one)
	test('some', some)
	test('all', all)
	t.equal(empty.findIndex(some), [].findIndex(some), 'empty')
	test('index', withIndex(some), some)
	test('source', withSource(some, iterable), some)
	test('thisArg', withThisArg(some, thisArg), some, true)
	t.end()
})

tap.test('forEach', t => {
	let buffer = []
	iterable.forEach(v => { buffer.push(v) })
	t.strictSame(buffer, array, 'element')

	buffer = []
	empty.forEach(v => { buffer.push(v) })
	t.strictSame(buffer, [])

	buffer = []
	iterable.forEach((v, i) => { buffer.push([v, i]) })
	t.strictSame(buffer, array.map((v, i) => [v, i]), 'index')

	buffer = []
	iterable.forEach((v, _i, s) => { buffer.push([v, s]) })
	t.strictSame(buffer, array.map(v => [v, iterable]), 'source')

	buffer = []
	iterable.forEach(function (v) { buffer.push([v, this]) }, thisArg)
	t.strictSame(buffer, array.map(v => [v, thisArg]), 'thisArg')

	t.end()
})

tap.test('includes', t => {
	t.equal(iterable.includes(1), true, 'first')
	t.equal(iterable.includes(2), true, 'middle')
	t.equal(iterable.includes(3), true, 'last')
	t.equal(iterable.includes(0), false, 'none')
	t.equal(iterable.includes(2, 1), true, 'fromIndex, first')
	t.equal(iterable.includes(3, 1), true, 'fromIndex, last')
	t.equal(iterable.includes(0, 1), false, 'fromIndex, none')
	t.equal(iterable.includes(1, 1), false, 'fromIndex, none after')
	t.equal(iterable.includes(3, -2), true, 'fromIndex, negative before')
	t.equal(iterable.includes(3, -3), true, 'fromIndex, negative on')
	t.equal(iterable.includes(0, -3), false, 'fromIndex, negative none')
	t.equal(iterable.includes(1, -2), false, 'fromIndex, negative none after')
	t.equal(iterable.includes(3, 3), false, 'fromIndex, beyond range')
	t.equal(iterable.includes(3, -4), true, 'fromIndex, before range')
	t.end()
})

tap.test('indexOf', t => {
	t.equal(iterable.indexOf(1), 0, 'first')
	t.equal(iterable.indexOf(2), 1, 'middle')
	t.equal(iterable.indexOf(3), 2, 'last')
	t.equal(iterable.indexOf(0), -1, 'none')
	t.equal(iterable.indexOf(2, 1), 1, 'fromIndex, first')
	t.equal(iterable.indexOf(3, 1), 2, 'fromIndex, last')
	t.equal(iterable.indexOf(0, 1), -1, 'fromIndex, none')
	t.equal(iterable.indexOf(1, 1), -1, 'fromIndex, none after')
	t.equal(iterable.indexOf(3, -2), 2, 'fromIndex, negative before')
	t.equal(iterable.indexOf(3, -3), 2, 'fromIndex, negative on')
	t.equal(iterable.indexOf(0, -3), -1, 'fromIndex, negative none')
	t.equal(iterable.indexOf(1, -2), -1, 'fromIndex, negative none after')
	t.equal(iterable.indexOf(3, 3), -1, 'fromIndex, beyond range')
	t.equal(iterable.indexOf(3, -4), 2, 'fromIndex, before range')
	t.equal(dupes.indexOf(1), 0, 'dupes')
	t.equal(dupes.indexOf(1, 1), 1, 'dupes, fromIndex')
	t.equal(dupes.indexOf(1, -6), 0, 'dupes, fromIndex negative')
	t.end()
})

tap.test('itemAt', t => {
	t.equal(iterable.itemAt(0), array[0], 'first')
	t.equal(iterable.itemAt(1), array[1], 'middle')
	t.equal(iterable.itemAt(2), array[2], 'last')
	t.equal(iterable.itemAt(3), array[3], 'beyond range')
	t.equal(iterable.itemAt(-1), array[-1], 'before range')
	t.equal(empty.itemAt(0), [][0], 'empty')
	t.end()
})

tap.test('join', t => {
	t.equal(iterable.join(','), '1,2,3', 'comma')
	t.equal(iterable.join('abc'), '1abc2abc3', 'abc')
	t.equal(iterable.join(''), '123', 'empty string')
	t.equal(iterable.join(), '123', 'none')
	t.equal(empty.join(), '', 'empty')
	t.end()
})

tap.test('keys', t => {
	t.strictSame(Array.from(iterable.keys()), Array.from(array.keys()), 'values')
	t.strictSame(Array.from(empty.keys()), Array.from([].keys()), 'empty')
	t.end()
})

tap.test('lastIndexOf', t => {
	t.equal(iterable.lastIndexOf(1), 0, 'first')
	t.equal(iterable.lastIndexOf(2), 1, 'middle')
	t.equal(iterable.lastIndexOf(3), 2, 'last')
	t.equal(iterable.lastIndexOf(0), -1, 'none')
	t.equal(iterable.lastIndexOf(2, 1), 1, 'fromIndex, first')
	t.equal(iterable.lastIndexOf(3, 2), 2, 'fromIndex, last')
	t.equal(iterable.lastIndexOf(0, 1), -1, 'fromIndex, none')
	t.equal(iterable.lastIndexOf(3, 1), -1, 'fromIndex, none before')
	t.equal(iterable.lastIndexOf(1, -2), 0, 'fromIndex, negative after')
	t.equal(iterable.lastIndexOf(1, -3), 0, 'fromIndex, negative on')
	t.equal(iterable.lastIndexOf(0, -3), -1, 'fromIndex, negative none')
	t.equal(iterable.lastIndexOf(3, -2), -1, 'fromIndex, negative none before')
	t.equal(iterable.lastIndexOf(3, 3), 2, 'fromIndex, beyond range')
	t.equal(iterable.lastIndexOf(3, -4), -1, 'fromIndex, before range')
	t.equal(dupes.lastIndexOf(1), 1, 'dupes')
	t.equal(dupes.lastIndexOf(1, 0), 0, 'dupes, fromIndex')
	t.equal(dupes.lastIndexOf(1, -6), 0, 'dupes, fromIndex negative')
	t.end()
})

tap.test('map', t => {
	function test (name, actualCallback, expectedCallback = actualCallback, useThisArg = false) {
		t.strictSame(Array.from(iterable.map(actualCallback, useThisArg ? thisArg : undefined)), array.map(expectedCallback), name)
	}

	const doubler = v => v * 2

	test('element', doubler)
	t.strictSame(Array.from(empty.map(doubler)), [], 'empty')
	test('index', withIndex(doubler), doubler)
	test('source', withSource(doubler, iterable), doubler)
	test('thisArg', withThisArg(doubler, thisArg), doubler, true)
	t.end()
})

tap.test('reduce', t => {
	function test (name, actualCallback, expectedCallback = actualCallback, initialValue = undefined) {
		let actual
		let expected
		if (initialValue == null) {
			actual = iterable.reduce(actualCallback)
			expected = array.reduce(expectedCallback)
		} else {
			actual = iterable.reduce(actualCallback, initialValue)
			expected = array.reduce(expectedCallback, initialValue)
		}

		t.equal(actual, expected, name)
	}

	const add = (a, b) => a + b

	const withIndex = (callback, start) => {
		let index = start
		return (a, b, i) => {
			assert.strictEqual(i, index++)
			return callback(a, b)
		}
	}

	const withSource = (callback, source) => {
		return (a, b, _i, s) => {
			assert.strictEqual(s, source)
			return callback(a, b)
		}
	}

	test('values', add)
	test('index', withIndex(add, 1), add)
	test('source', withSource(add, iterable), add)
	test('initialValue', add, add, 10)
	test('initialValue, index', withIndex(add, 0), add, 10)
	t.throws(() => {
		empty.reduce(add)
	}, 'empty')
	t.equal(empty.reduce(add, 10), 10, 'empty, initialValue')
	t.end()
})

tap.test('reduceRight', t => {
	function test (name, actualCallback, expectedCallback = actualCallback, initialValue = undefined) {
		let actual
		let expected
		if (initialValue == null) {
			actual = iterable.reduceRight(actualCallback)
			expected = array.reduceRight(expectedCallback)
		} else {
			actual = iterable.reduceRight(actualCallback, initialValue)
			expected = array.reduceRight(expectedCallback, initialValue)
		}

		t.equal(actual, expected, name)
	}

	const divide = (a, b) => a / b

	const withIndex = (callback, start) => {
		let index = start
		return (a, b, i) => {
			assert.strictEqual(i, index--)
			return callback(a, b)
		}
	}

	const withSource = (callback, source) => {
		return (a, b, _i, s) => {
			assert.strictEqual(s, source)
			return callback(a, b)
		}
	}

	test('values', divide)
	test('index', withIndex(divide, 1), divide)
	test('source', withSource(divide, iterable), divide)
	test('initialValue', divide, divide, 10)
	test('initialValue, index', withIndex(divide, 2), divide, 10)
	t.throws(() => {
		empty.reduceRight(divide)
	}, 'empty')
	t.equal(empty.reduceRight(divide, 10), 10, 'empty, initialValue')
	t.end()
})

tap.test('reverse', t => {
	t.strictSame(Array.from(iterable.reverse()), array.slice().reverse(), 'values')
	t.strictSame(Array.from(empty.reverse()), [], 'empty')
	t.end()
})

tap.test('slice', t => {
	t.strictSame(Array.from(iterable.slice()), array.slice(), 'default')
	t.strictSame(Array.from(iterable.slice(1)), array.slice(1), 'begin')
	t.strictSame(Array.from(iterable.slice(1, 2)), array.slice(1, 2), 'end')
	t.end()
})

tap.test('some', t => {
	t.equal(iterable.some(none), false, 'none')
	t.equal(iterable.some(one), true, 'one')
	t.equal(iterable.some(some), true, 'some')
	t.equal(iterable.some(all), true, 'all')
	t.equal(empty.some(all), false, 'empty')
	t.equal(iterable.some(withIndex(some)), true, 'index')
	t.equal(iterable.some(withSource(some, iterable)), true, 'iterable')
	t.equal(iterable.some(withThisArg(some, thisArg), thisArg), true, 'thisArg')
	t.end()
})

tap.test('sort', t => {
	function test (name, compareFunction) {
		t.strictSame(Array.from(iterable.sort(compareFunction)), array.slice().sort(compareFunction), name)
	}

	const lt = (a, b) => a < b ? -1 : a > b ? 1 : 0
	const gt = (a, b) => a > b ? -1 : a < b ? 1 : 0
	const twoFirst = (a, b) => a === b ? 0 : a === 2 ? -1 : a < b ? -1 : a > b ? 1 : 0

	const other = [9, 10, 11]

	test('default')
	test('lt', lt)
	test('lg', gt)
	test('twoFirst', twoFirst)
	t.strictSame(Array.from(empty), [], 'empty')
	t.strictSame(Array.from(new LazyIterable(other).sort()), other.slice().sort(), 'strings')
	t.end()
})

tap.test('toArray', t => {
	t.strictSame(iterable.toArray(), array, 'values')
	t.strictSame(empty.toArray(), [], 'empty')
	t.end()
})

tap.test('values', t => {
	t.strictSame(Array.from(iterable.values()), array, 'values')
	t.strictSame(Array.from(empty.values()), [], 'empty')
	t.end()
})

tap.test('lazy', t => {
	let iterated = false

	let iterable = new LazyIterable(function * () {
		iterated = true
		yield 1
		yield 2
		yield 3
	})

	iterable = iterable.map(v => v * 2)
	t.equal(iterated, false, 'not iterated')

	iterable.toArray()
	t.equal(iterated, true, 'iterated')

	t.end()
})

tap.test('chaining', t => {
	const actual = Array.from(
		iterable
			.concat(other)
			.map(v => v * 2)
			.sort()
	)

	const expected = array
		.concat(other)
		.map(v => v * 2)
		.sort()

	t.strictSame(actual, expected, 'values')
	t.end()
})

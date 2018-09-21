/**
 * Represents an iterable object that can be chained and is only evaluated once
 * it is iterated.
 */
class LazyIterable<T> implements Iterable<T> {
	private _generator: () => Iterator<T>

	/**
	 * Creates a LazyIterable from an iterable object.
	 * @param source An iterable object from which to create a LazyIterable.
	 */
	constructor (source: Iterable<T>)

	/**
	 * Creates a LazyIterable from a function.
	 * @param source A function that returns an iterator.
	 */
	constructor (source: () => Iterator<T>)

	constructor (source: Iterable<T> | (() => Iterator<T>)) {
		if (source == null) throw new Error('source is null or undefined.')

		const iterable = source as Iterable<T>
		if (typeof iterable[Symbol.iterator] === 'function') {
			this._generator = function* () {
				yield* iterable
			}
		} else if (typeof source === 'function') {
			this._generator = source
		} else {
			throw new Error('source is not iterable or a generator function.')
		}
	}

	/**
	 * Creates a LazyIterable from an iterable object.
	 * @param source An iterable object from which to create a LazyIterable.
	 */
	public static from<T> (source: Iterable<T>): LazyIterable<T> {
		return new LazyIterable(function* () {
			yield* source
		})
	}

	/**
	 * Returns an iterator for this instance.
	 */
	public [Symbol.iterator] (): Iterator<T> {
		return this._generator()
	}

	/**
	 * Returns the number of items iterated by this instance. Accessing this
	 * property causes this instance to be iterated.
	 */
	get length (): number {
		let index = 0
		for (const _value of this) index++
		return index
	}

	/**
	 * Returns a new LazyIterable with the specified iterable objects
	 * concatenated to it.
	 * @param values An array of iterable object to be concatenated to this
	 * instance.
	 */
	public concat (...values: Iterable<T>[]): LazyIterable<T>

	/**
	 * Returns a new LazyIterable with the specified items or items of the
	 * specified iterable objects concatenated to this instance.
	 * @param values An array of items or iterable objects whose items are to be
	 * to concatenated to this instance.
	 */
	public concat (...values: (T | Iterable<T>)[]): LazyIterable<T>

	public concat (...values: (T | Iterable<T>)[]): LazyIterable<T> {
		const source = this
		return new LazyIterable<T>(function* () {
			yield* source
			for (const value of values) {
				const iterable = value as Iterable<T>
				if (typeof iterable[Symbol.iterator] === 'function') {
					yield* iterable
				} else {
					yield value as T
				}
			}
		})
	}

	/**
	 * Returns a new LazyIterable that iterates the index/value pairs of the
	 * items of this instance.
	 */
	public entries (): LazyIterable<[number, T]> {
		const source = this
		return new LazyIterable<[number, T]>(function* () {
			let index = 0
			for (const value of source) {
				yield [index++, value]
			}
		})
	}

	/**
	 * Determines whether every item in this instance fulfills a predicate.
	 * Calling this method causes this instance to be iterated.
	 * @param callback A predicate function to test each item against.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public every (callback: (value: T, index?: number, source?: LazyIterable<T>) => void, thisArg: any = this): boolean {
		let index = 0
		for (const value of this) {
			if (!callback.call(thisArg, value, index++, this)) {
				return false
			}
		}

		return true
	}

	/**
	 * Returns a new LazyIterable that will iterate only the items that fulfill
	 * the specified predicate.
	 * @param callback A predicate function to test each item against.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public filter (callback: (value: T, index?: number, source?: LazyIterable<T>) => void, thisArg: any = this): LazyIterable<T> {
		const source = this
		return new LazyIterable(function* () {
			let index = 0
			for (const value of source) {
				if (callback.call(thisArg, value, index++, source)) {
					yield value
				}
			}
		})
	}

	/**
	 * Returns the first item that fulfills the specified predicate. Calling
	 * this method causes this instance to be iterated.
	 * @param callback A predicate function to test each item against.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public find (callback: (value: T, index?: number, source?: LazyIterable<T>) => void, thisArg: any = this): T | undefined {
		let index = 0
		for (const value of this) {
			if (callback.call(thisArg, value, index++, this)) {
				return value
			}
		}
	}

	/**
	 * Returns the index of the first item that fulfills the specified
	 * predicate. Calling this method causes this instance to be iterated.
	 * @param callback A predicate function to test each item against.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public findIndex (callback: (value: T, index?: number, source?: LazyIterable<T>) => void, thisArg: any = this): number {
		let index = 0
		for (const value of this) {
			if (callback.call(thisArg, value, index, this)) {
				return index
			}

			index++
		}

		return -1
	}

	/**
	 * Executes a function for each item in this instance. Calling this method
	 * causes this instance to be iterated.
	 * @param callback The function to execute for each item.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public forEach (callback: (value: T, index?: number, source?: LazyIterable<T>) => void, thisArg: any = this): void {
		let index = 0
		for (const value of this) {
			callback.call(thisArg, value, index++, this)
		}
	}

	/**
	 * Determines whether this instance includes a specified item. Calling this
	 * method causes this instance to be iterated.
	 * @param searchValue The value to search for.
	 * @param fromIndex The index from which to start searching.
	 */
	public includes (searchValue: T, fromIndex = 0): boolean {
		let index = 0
		if (fromIndex >= 0) {
			for (const value of this) {
				if (index++ >= fromIndex && value === searchValue) {
					return true
				}
			}

			return false
		} else {
			let foundIndex = -1
			for (const value of this) {
				if (value === searchValue) {
					foundIndex = index
				}

				index++
			}

			if (foundIndex < 0) {
				return false
			}

			if (fromIndex + index < 0) {
				fromIndex = -index
			}

			return foundIndex >= fromIndex + index
		}
	}

	/**
	 * Returns the first index of the specified item in this instance. Calling
	 * this method causes this instance to be iterated.
	 * @param searchValue The value to search for.
	 * @param fromIndex The index from which to start searching.
	 */
	public indexOf (searchValue: T, fromIndex = 0): number {
		let index = 0
		if (fromIndex >= 0) {
			for (const value of this) {
				if (index >= fromIndex && value === searchValue) {
					return index
				}

				index++
			}

			return -1
		} else {
			const found = []
			for (const value of this) {
				if (value === searchValue) {
					found.push(index)
				}

				index++
			}

			if (found.length === 0) {
				return -1
			}

			fromIndex += index

			for (const i of found) {
				if (i >= fromIndex) {
					return i
				}
			}

			return -1
		}
	}

	/**
	 * Returns the item at the specified index in this instance.
	 * @param index The index of the item.
	 */
	public itemAt (index: number): T | undefined {
		let i = 0
		for (const value of this) {
			if (index === i++) {
				return value
			}
		}
	}

	/**
	 * Returns a string of all of the items in this instance. Calling this
	 * method causes this instance to be iterated.
	 * @param separator A string used to separate the items in the resulting
	 * string.
	 */
	public join (separator = ''): string {
		let first = true
		let s = ''
		for (const value of this) {
			if (first) {
				first = false
			} else {
				s += separator
			}

			s += value
		}

		return s
	}

	/**
	 * Returns a new LazyIterable that iterates the index of each item in this
	 * instance.
	 */
	public keys (): LazyIterable<number> {
		const source = this
		return new LazyIterable<number>(function* () {
			let index = 0
			for (const _value of source) {
				yield index++
			}
		})
	}

	/**
	 * Returns the last index of the specified item in this instance by
	 * searching backward. Calling this method causes this instance to be
	 * iterated.
	 * @param searchValue The value to search for.
	 * @param fromIndex The index from which to start searching backward.
	 */
	public lastIndexOf (searchValue: T, fromIndex?: number): number {
		let index = 0
		const found = []
		for (const value of this) {
			if (value === searchValue) {
				found.unshift(index)
			}

			index++
		}

		if (found.length === 0) {
			return -1
		}

		if (fromIndex == null) {
			fromIndex = index - 1
		} else if (fromIndex < 0) {
			fromIndex += index
		}

		for (const i of found) {
			if (i <= fromIndex) {
				return i
			}
		}

		return -1
	}

	/**
	 * Returns a new LazyIterable that iterates items of this instance
	 * transformed by a function. Calling this method causes this instance to be
	 * iterated.
	 * @param callback The function that transforms each item.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public map<U> (callback: (value: T, index?: number, source?: LazyIterable<T>) => U, thisArg: any = this): LazyIterable<U> {
		const source = this
		let index = 0
		return new LazyIterable(function* () {
			for (const value of source) {
				yield callback.call(thisArg, value, index++, source)
			}
		})
	}

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance. Calling this method causes this instance to be iterated.
	 * @param callback The reducing function to to call on each item.
	 */
	public reduce (callback: (previousValue: T, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => T): T

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance. Calling this method causes this instance to be iterated.
	 * @param callback The reducing function to to call on each item.
	 */
	public reduce<U> (callback: (previousValue: T | U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => U): U

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance. Calling this method causes this instance to be iterated.
	 * @param callback The reducing function to to call on each item.
	 * @param initialValue The initial value used in the reducing function.
	 */
	public reduce<U> (callback: (previousValue: U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => U, initialValue: U): U

	public reduce<U> (callback: (previousValue: T | U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => T | U, initialValue?: U): T | U {
		const hasInitialValue = arguments.length > 1
		let first = true
		let result: T | U = initialValue as U
		let index = 0
		let isEmpty = true
		for (const value of this) {
			if (first) {
				result = hasInitialValue ? callback(result as U, value, index, this) : value
				first = false
			} else {
				result = callback(result as T | U, value, index, this)
			}

			index++
			isEmpty = false
		}

		if (isEmpty) {
			if (hasInitialValue) {
				return initialValue as U
			}

			throw new Error('Reduce of empty iterable with no initial value')
		}

		return result as T | U
	}

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance in reverse order. Calling this method causes this instance to be
	 * iterated.
	 * @param callback The reducing function to to call on each item.
	 */
	public reduceRight (callback: (previousValue: T, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => T): T

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance in reverse order. Calling this method causes this instance to be
	 * iterated.
	 * @param callback The reducing function to to call on each item.
	 */
	public reduceRight<U> (callback: (previousValue: T | U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => U): U

	/**
	 * Returns the result of a reducing function called for each item in this
	 * instance in reverse order. Calling this method causes this instance to be
	 * iterated.
	 * @param callback The reducing function to to call on each item.
	 * @param initialValue The initial value used in the reducing function.
	 */
	public reduceRight<U> (callback: (previousValue: U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => U, initialValue: U): U

	public reduceRight<U> (callback: (previousValue: T | U, currentValue: T, currentIndex?: number, source?: LazyIterable<T>) => T | U, initialValue?: U): T | U {
		const buffer = Array.from(this)
		if (arguments.length > 1) {
			return buffer.reduceRight((a, b, i) => callback(a, b, i, this) as U, initialValue as U)
		} else {
			return buffer.reduceRight((a, b, i) => callback(a, b, i, this) as T)
		}
	}

	/**
	 * Returns new LazyIterable that iterates the items in this instance in
	 * reverse order.
	 */
	public reverse (): LazyIterable<T> {
		const source = this
		return new LazyIterable(function* () {
			yield* Array.from(source).reverse()
		})
	}

	/**
	 * Returns a new LazyIterable that iterates a portions of the items in this
	 * instance.
	 * @param begin The index of the first item to include.
	 * @param end The index of the first item to exclude.
	 */
	public slice (begin = 0, end?: number): LazyIterable<T> {
		const source = this
		let index = 0
		return new LazyIterable<T>(function* () {
			for (const value of source) {
				if (index >= begin && (end == null || index < end)) {
					yield value
				}

				index++
			}
		})
	}

	/**
	 * Determines whether any item in this instance fulfills a predicate.
	 * Calling this method causes this instance to be iterated.
	 * @param callback A predicate function to test each item against.
	 * @param thisArg The value to use as `this` when executing `callback`.
	 */
	public some (callback: (element: T, index?: number, source?: LazyIterable<T>) => boolean, thisArg: any = this): boolean {
		let index = 0
		for (const value of this) {
			if (callback.call(thisArg, value, index++, this)) {
				return true
			}
		}

		return false
	}

	/**
	 * Returns a new LazyIterable that iterates the items in this instances in
	 * sorted order.
	 * @param compareFunction A function that determines the order of the items.
	 */
	public sort (compareFunction?: (a: T, b: T) => number): LazyIterable<T> {
		const source = this
		return new LazyIterable(function* () {
			yield* Array.from(source).sort(compareFunction)
		})
	}

	/**
	 * Returns an array of the items in this instance. Calling this method
	 * causes this instance to be iterated.
	 */
	public toArray (): T[] {
		return Array.from(this)
	}

	/**
	 * Returns new LazyIterable that iterates the items in this instance.
	 */
	public values (): LazyIterable<T> {
		const source = this
		return new LazyIterable(function* () {
			yield* source
		})
	}
}

export = LazyIterable

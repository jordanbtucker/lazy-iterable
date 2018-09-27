# LazyIterable
An iterable object that lazily implements many `Array.prototype` members.

```js
function * generator () {
  yield 1
  yield 2
  yield 3
}

const lazy = new LazyIterable(generator)

const array = lazy.map(v => v * 2).toArray()

console.log(array) // [2, 4, 6]
```

The advantage that `LazyIterable` has over `Array` is that the its source is
evaluated as late as possible.

```js
let iterated = false

function * generator () {
  iterated = true
  yield 1
  yield 2
  yield 3
}

let lazy = new LazyIterable(generator)
console.log(iterated) // false

lazy = lazy.map(v => v * 2)
console.log(iterated) // false

const array = lazy.toArray()
console.log(iterated) // true
```

`LazyIterable` implements most of the read-only members of `Array.prototype` as
well as a couple _in-place_ members in a read-only fashion.

- Lazy members
  - `concat`
  - `entries`
  - `filter`
  - `keys`
  - `map`
  - `reverse`
  - `slice`
  - `sort`
  - `values`
- Eager members:
  - `length`
  - `every`
  - `find`
  - `findIndex`
  - `forEach`
  - `includes`
  - `indexOf`
  - `itemAt`
  - `join`
  - `reduce`
  - `reduceRight`
  - `some`
  - `toArray`

`reverse` and `sort` each return a new `LazyIterable` whereas `Array` performs
the action in-place.

Read more in the [API
Documentation](https://jordanbtucker.github.io/lazy-iterable/classes/_lazy_iterable_.lazyiterable.html).

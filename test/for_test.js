import check from './support/check.js';

describe.only('for loops', () => {
  it('transforms basic for-of loops into for-in', () => {
    check(`
      for k of o
        k
    `, `
      for (let k in o) {
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value into for-in', () => {
    check(`
      for k, v of o
        k
    `, `
      for (let k in o) {
        let v = o[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with both key and value plus unsafe-to-repeat target by saving a reference', () => {
    check(`
      for k, v of object()
        k
    `, `
      let iterable;
      for (let k in (iterable = object())) {
        let v = iterable[k];
        k;
      }
    `);
  });

  it('transforms for-of loops with destructured value', () => {
    check(`
      for k, {x, y} of o
        k + x
    `, `
      for (let k in o) {
        let {x, y} = o[k];
        k + x;
      }
    `);
  });

  it('transforms for-of loops with destructured value plus unsafe-to-repeat target', () => {
    check(`
      for key, {x, y} of object()
        key + x
    `, `
      let iterable;
      for (let key in (iterable = object())) {
        let {x, y} = iterable[key];
        key + x;
      }
    `);
  });

  it('transforms for-in loops to typical `for` loops', () => {
    check(`
      for a in b
        a
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        a;
      }
    `);
  });

  it('transforms for-in loops with an index to typical `for` loops', () => {
    check(`
      for a, j in b
        a
    `, `
      for (let j = 0; j < b.length; j++) {
        let a = b[j];
        a;
      }
    `);
  });

  it('transforms `for` loops without an index', () => {
    check(`
      for [0..1]
        2
    `, `
      for (let i = 0; i <= 1; i++) {
        2;
      }
    `);
  });

  it('gives `for` loops without an index an index that does not collide with existing bindings', () => {
    check(`
      for [0..1]
        i
    `, `
      for (let j = 0; j <= 1; j++) {
        i;
      }
    `);
  });

  it('allows iterating with for-in by a specific step size', () => {
    check(`
      for a in b by 2
        a
    `, `
      for (let i = 0; i < b.length; i += 2) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse', () => {
    check(`
      for a in b by -1
        a
    `, `
      for (let i = b.length - 1; i >= 0; i--) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows iterating with for-in in reverse with a specific step size', () => {
    check(`
      for a in b by -2
        a
    `, `
      for (let i = b.length - 1; i >= 0; i -= 2) {
        let a = b[i];
        a;
      }
    `);
  });

  it('allows filtering using a `when` clause', () => {
    check(`
      for a in b when a.c
        a
    `, `
      for (let i = 0; i < b.length; i++) {
        let a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('allows using both `when` and `by` clauses', () => {
    check(`
      for a in b by 2 when a.c
        a
    `, `
      for (let i = 0, a; i < b.length; i += 2) {
        a = b[i];
        if (a.c) {
          a;
        }
      }
    `);
  });

  it('extracts unsafe-to-repeat iteration targets before the for-in loop', () => {
    check(`
      for e in list()
        break
    `, `
      let iterable = list();
      for (let i = 0, e; i < iterable.length; i++) {
        e = iterable[i];
        break;
      }
    `);
  });

  it('special-cases for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0..10]
        i
    `, `
      for (let i = 0; i <= 10; i++) {
        i;
      }
    `);
  });

  it('special-cases for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [0...10]
        i
    `, `
      for (let i = 0; i < 10; i++) {
        i;
      }
    `);
  });

  it('special-cases descending for-in inclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10..0]
        i
    `, `
      for (let i = 10; i >= 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in exclusive range loops to avoid creating arrays', () => {
    check(`
      for i in [10...0]
        i
    `, `
      for (let i = 10; i > 0; i--) {
        i;
      }
    `);
  });

  it('special-cases descending for-in range loops with step count to avoid creating arrays', () => {
    check(`
      for i in [100..0] by -2
        i
    `, `
      for (let i = 100; i >= 0; i -= 2) {
        i;
      }
    `);
  });

  it('allows using an unsafe-to-repeat step value', () => {
    check(`
      for a in b by (c d)
        a()
    `, `
      for (let i = 0, step = c(d); i < b.length; i += step) {
        a();
      }
    `);
  });

  it('special-cases variable for-in range loops to avoid creating arrays', () => {
    check(`
      for i in [a..b]
        i
    `, `
      for (let i = a; a < b ? i <= b : i >= b; a < b ? i++ : i--) {
        i;
      }
    `);
  });

  it('saves references to unsafe-to-repeat range bounds in variable for-in loops', () => {
    check(`
      for i in [a()..b()]
        i
    `, `
      let start = a();
      let end = b();
      for (let i = start; start < end ? i <= end : i >= end; start < end ? i++ : i--) {
        i;
      }
    `);
  });

  it('moves the body of a one-line for-of loop to the next line', () => {
    check(`
      k for k of o
    `, `
      for (let k in o) {
        k;
      }
    `);
  });

  it('moves the body of a one-line for-in loop to the next line', () => {
    check(`
      e for e in l
    `, `
      for (let i = 0, e; i < l.length; i++) {
        e = l[i];
        e;
      }
    `);
  });

  it('saves the list of results when for-of loops are used in an expression context', () => {
    check(`
      a(k for k of o)
    `, `
      a((() => {
        let result = [];
        for (let k in o) {
          result.push(k);
        }
        return result;
      })());
    `);
  });

  it('saves the list of results when for-in loops are used in an expression context', () => {
    check(`
      a(e for e in l)
    `, `
      a((() => {
        let result = [];
        for (let i = 0, e; i < l.length; i++) {
          e = l[i];
          result.push(e);
        }
        return result;
      })());
    `);
  });

  it('saves the list of results when for-in loops are used as an implicit return', () => {
    check(`
      ->
        a for a in b
    `, `
      (function() {
        return (() => {
          let result = [];
          for (let i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push(a);
          }
          return result;
        })();
      });
    `);
  });

  it('closes the call to `result.push()` at the right position', () => {
    check(`
      ->
        for a in b
          if a
            b

      # this is here to make the real end of "a" be much later
      stuff
    `, `
      (function() {
        return (() => {
          let result = [];
          for (let i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push((() => {
              if (a) {
                return b;
              }
            })());
          }
          return result;
        })();
      });

      // this is here to make the real end of "a" be much later
      stuff;
    `);
  });

  it('generates counters for nested loops that follow typical convention', () => {
    check(`
      for a in b
        for c in d
          a + c
    `, `
      for (let i = 0, a; i < b.length; i++) {
        a = b[i];
        for (let j = 0, c; j < d.length; j++) {
          c = d[j];
          a + c;
        }
      }
    `);
  });

  it('handles `for own`', () => {
    check(`
      for own key of list
        console.log key
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          console.log(key);
        }
      }
    `);
  });

  it('handles `for own` with an unsafe-to-repeat iterable', () => {
    check(`
      for own key of getList()
        console.log key
    `, `
      let iterable;
      for (let key in (iterable = getList())) {
        if (Object.prototype.hasOwnProperty.call(iterable, key)) {
          console.log(key);
        }
      }
    `);
  });

  it('handles `for own` with both key and value', () => {
    check(`
      for own key, value of list
        console.log key, value
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          let value = list[key];
          console.log(key, value);
        }
      }
    `);
  });

  it('handles `for own` with a filter', () => {
    check(`
      for own key of list when key[0] is '_'
        console.log key
    `, `
      for (let key in list) {
        if (Object.prototype.hasOwnProperty.call(list, key)) {
          if (key[0] === '_') {
            console.log(key);
          }
        }
      }
    `);
  });

  it('handles single-line `for own`', () => {
    check(`
      a for own a of b
    `, `
      for (let a in b) {
        if (Object.prototype.hasOwnProperty.call(b, a)) {
          a;
        }
      }
    `);
  });

  it('does not consider a `for` loop as an implicit return if it returns itself', () => {
    check(`
      ->
        for a in b
          return a
    `, `
      (function() {
        for (let i = 0, a; i < b.length; i++) {
          a = b[i];
          return a;
        }
      });
    `);
  });

  it('considers a `for` loop as an implicit return if it only returns within a function', () => {
    check(`
      ->
        for a in b
          -> return a
    `, `
      (function() {
        return (() => {
          let result = [];
          for (let i = 0, a; i < b.length; i++) {
            a = b[i];
            result.push(function() { return a; });
          }
          return result;
        })();
      });
    `);
  });

  it('turns single-line `for-in` loop with `then` into multi-line `for` loop', () => {
    check(`
      for a in b then a()
    `, `
      for (let i = 0, a; i < b.length; i++) {
        a = b[i];
        a();
      }
    `);
  });

  it('turns single-line `for-of` loop with `then` into multi-line `for` loop', () => {
    check(`
      for k of o then k
    `, `
      for (let k in o) {
        k;
      }
    `);
  });

  it('indents body of multi-line `for` body with `then`', () => {
    check(`
      for a in b then do (a) ->
        a
    `, `
      for (let i = 0, a; i < b.length; i++) {
        a = b[i];
        (function(a) {
          return a;
        })(a);
      }
    `);
  });
});

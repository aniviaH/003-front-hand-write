// new Promise((resolve, reject) => {
//   resolve(123)
//   reject('报错了')
// }).then((value) => {
//   console.log('成功的值：', value)
// }, (reason) => {
//   console.log('失败的原因：', reason)
// })

/**
 * 1. 传入了一个函数，函数参数resolve, reject
 * 2. 三种状态：等待中 pending, 成功装填 fullfilled, 失败的状态 rejected
 * 3. resolve() pending -> fullfilled, reject() pending -> rejected
 * 4. 状态一旦变化，就不再变更 pending 要么变为 fullfilled 要么变为 rejected
 * 5. then方法接收两个参数，都是函数(successCb, failCb)，能拿到 成功的值 或 失败的原因
 * 
 */

const PENDING = 'pending' // 等待状态
const FULLFILLED = 'fullfilled' // 成功的状态
const REJECTED = 'rejected' // 失败的状态

class MyPromise {
  state = PENDING
  value = undefined // resolve() 后，成功的值
  reason = undefined // reject()后，失败的值
  successCb = []
  failCb = []

  constructor (executor, value, reason) {
    // 或者成员函数使用箭头函数
    this.resolve = this.resolve.bind(this)
    this.reject = this.reject.bind(this)
    this.then = this.then.bind(this)

    try {
      executor(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
  }

  resolve (value) {
    if (this.state !== PENDING) return
    this.state = FULLFILLED
    this.value = value

    // this.successCb && this.successCb(this.value)
    while (this.successCb.length) {
      this.successCb.shift()(this.value)
    }
  }

  reject (reason) {
    if (this.state !== PENDING) return
    this.state = REJECTED
    this.reason = reason

    // this.failCb && this.failCb(this.reason)
    while (this.failCb.length) {
      this.failCb.shift()(this.reason)
    }
  }

  then (successCb, failCb) {
    return new MyPromise((resolve, reject) => {
      // 兼容 处理then方法两个参数都不传递，手动包裹成一下，后续then，catch也能执行到
      successCb = successCb ? successCb : value => value
      failCb = failCb ? failCb : reason => { throw reason } // then里面try catch的catch语句里调用this.reject就会导致MyPromise.catch回调触发不了，调用当前的reject就行
      // failCb = failCb ? failCb : reason => { reject(reason) }

      if (this.state === FULLFILLED) {
        try {
          const x = successCb(this.value)
          // 需要定义一个方法，判断 x 是普通值，还是promise对象，如果是promise对象，需要让他执行一下
          // resolve(x)
          resolvePromise(x, resolve, reject)
        } catch (error) {
          reject(error)
        }
        
      } else if (this.state === REJECTED) {
        try {
          const x = failCb(this.reason)
          // reject(x)
          resolvePromise(x, resolve, reject)
        } catch (error) {
          reject(error)
        }
      } else {
        // 一般遇到异步的时候，会走到else，也就是当前状态是pending状态，把成功和失败回调暂存起来
        // this.successCb = successCb
        // this.failCb = failCb

        successCb && this.successCb.push(() => {
          try {
            const x = successCb(this.value)
            // resolve(x)
            resolvePromise(x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
        failCb && this.failCb.push(() => {
          try {
            const x = failCb(this.reason)
            // reject(x)
            resolvePromise(x, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }
    })
  }

  static all (array) { // 这里应该是可迭代对象，内部循环使用for of
    let result = []
    let finished = 0
    return new MyPromise((resolve, reject) => {
      for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (element instanceof MyPromise) {
          element.then((value) => {
            finished++
            result[index] = value

            if (finished === array.length) {
              resolve(result)
            }
          }, (reason) => {
            reject(reason)
          })
        } else {
          finished++
          result[index] = element

          if (finished === array.length) {
            resolve(result)
          }
        }
      }
    })
  }

  catch(cb) {
    this.then(undefined, (reason) => {
      cb(reason)
    })
  }
}

function resolvePromise(x, resolve, reject) {
  if (x instanceof MyPromise) {
    // promise对象的时候，让他执行一下
    x.then((value) => {
      resolve(value)
    }, (reason) => {
      reject(reason)
    })
  } else {
    // 普通对象
    resolve(x)
  }
}

// 基础用法
// new MyPromise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(123)
//   }, 1000);
//   // resolve(123)
//   // reject('报错了')
// }).then((value) => {
//   console.log('成功的值：', value)
// }, (reason) => {
//   console.log('失败的原因：', reason)
// })

let promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve(123)
  }, 1000);
  // resolve(123)
  // reject('报错了')
})

// 返回结果调用then，then方法参数是两个回调函数
// promise.then((value) => {
//   console.log('成功的值 1：', value)
// }, (reason) => {
//   console.log('失败的原因 1：', reason)
// })

// promise.then((value) => {
//   console.log('成功的值 2：', value)
// }, (reason) => {
//   console.log('失败的原因 2：', reason)
// })

// 链式调用
// promise.then((value) => {
//   console.log('成功的值 1：', value)
//   return 456
// }, (reason) => {
//   console.log('失败1 ：', reason)
//   return 'error msg 1'
// }).then((value) => {
//   console.log('成功的值 2：', value)
//   return 789
// }, (reason) => {
//   console.log('失败2：', reason)
// })

// then的成功或失败回调也返回promise对象
// let promise2 = new MyPromise((resolve, reject) => {
//   resolve(666)
// })
// promise.then((value) => {
//   console.log('成功的值 1：', value)
//   return promise2
// }, (reason) => {
//   console.log('失败 1：', reason)
// }).then((value) => {
//   console.log('成功的值2：', value)
// }, (reason) => {
//   console.log('失败2：', reason)
// })

// 代码报错
// let promise3 = new MyPromise((reject) => {
//   throw 'error 111'
// })
// promise3.then((value) => {
//   console.log('成功的值1 ：', value)
// }, (reason) => {
//   console.log('失败：', reason)
// })

// MyPromise.all
// const p1 = new MyPromise((resolve, reject) => {
//   setTimeout(() => {
//     resolve('p1')
//   }, 1000);
// })
// const p2 = new MyPromise((resolve, reject) => {
//   resolve('p2')
// })
// MyPromise.all([1, '2', p1, p2]).then((res) => {
//   console.log('all result', res)
// })

// catch方法
const p3 = new MyPromise((resolve, reject) => {
  // throw 'error'
  reject('error')
}).then(
  // (value) => {
  //   console.log('成功的值1：', value)
  // }, (reason) => {
  //   console.log('失败1: ', reason)
  // }
).catch((e) => {
  console.log('catch: ', e)
})

// Test 顺序

// console.log('======')

// console.log(1)

// const p2 = new MyPromise((resolve, reject) => {
//   console.log(2)
//   setTimeout(() => {
//     resolve('p2')
//   }, 1000)
// })

// p2.then((value) => {
//   console.log(3, value)
// }, (reason) => {
//   console.log(3, reason)
// })

// console.log(4)

// setTimeout(() => {
//   console.log(5)
// }, 500)

// // 1 2 4 5 3

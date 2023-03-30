Promise.myAll = function (iterableObj) {
  return new Promise((resolve, reject) => {
    const result = []
    let count = 0 // 迭代次数
    let finished = 0 // 计数resolve状态的数量
    // 对可迭代对象进行迭代
    for (let item of iterableObj) {
      console.log('item', item)
      const workInpressIndex = count // 利用块级作用域产生对count在当前循环时的值的闭包
      // 可迭代对象的每一项可以不是Promise对象
      if (item instanceof Promise) {
        // 等待Promise的完成
        item.then(data => {
          console.log('data', data)
          // resolve(data)

          // result.push(data)
          // then里面是被异步执行的，需要保证结果数据的顺序与传进来的可迭代对象保持一致 需要使用下标进行对结果数组进行赋值
          result[workInpressIndex] = data
          finished++

          // 必须要在这里进行resolve
          if (finished === count) {
            // 所有可迭代对象都resolve
            resolve(result)
          }
        })
        .catch(reject) // 失败了，直接reject
      } else {
        // 不是Promise对象 直接把结果给他就行
        // result.push(item)
        result[workInpressIndex] = item
        finished ++
      }

      count++
    }

    // resolve(result)
  })
}


/**
  Promise.all
  1. Promise类的静态方法 函数
  2. 参数：可迭代对象 -- 原型上存在Symbol.iterator属性(说是 promise数组不准确)
  3. 返回值：调用后可以调用.then .catch, 这意味着Promise.all 是返回了一个promise出去
  4. Promise.all 对可迭代对象的所有成员 都进入fullfilled 才会返回结果 如果有一个失败了 则直接将失败原因丢出去
 */

const pro1 = Promise.resolve(1)
const pro2 = new Promise((resolve) => {
  setTimeout(() => {
    resolve(2)
  }, 2000);
})

// Promise.all('helloworld').then(data => {
//   console.log('Promise.all("helloworld") ==>>', data)
// }).catch(err => {
//   console.error(err)
// })
// Promise.all([pro1, 1]).then(data => {
//   console.log('data--', data)
// })

const promiseArr = [pro2, pro1, 3, {}]
Promise.myAll(promiseArr).then(data => {
  console.log('Promise.myAll result: ', data)
})
Promise.all(promiseArr).then(data => {
  console.log('Promise.all result: ', data)
})

// 对象是否是可以迭代的 如果我想要对象变得可以迭代的怎么办
/**
  const obj = {a: 'a', 'b': 'b'}
  obj[Symbol.iterator] = function* () {
    for (key in obj) {
      yield obj[key]
    }
  }
 */
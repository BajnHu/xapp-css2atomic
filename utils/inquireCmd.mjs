/*
 * @Author: baojun.hu baojun.hu@weimob.com
 * @Date: 2022-05-15 17:02:31
 * @LastEditors: baojun.hu baojun.hu@weimob.com
 * @LastEditTime: 2022-05-16 01:18:36
 * @FilePath: \replaceReply\utils\inputCmd.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import inquirer from 'inquirer';



// inquire 处理命令行交互
async function inquireCmd(packageList) {
    const res = await inquirer.prompt([
        {
            message: "请输入作为标准的原子化样式文件的相对路径",
            type: "input",
            name: "atomicFilePath",
            default: './platforms/ec/main/styles/app.wxss'
        },
        {
            message: "请选择目标样式对应的json或文件夹",
            type: "input",
            name: "targetPath",
            default: './packages/ec_orderDetail/detail/detail.json'
        }
    ]).then((res) => {
        return res
    })
    return Promise.resolve(res)
}
export default inquireCmd
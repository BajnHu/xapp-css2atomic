
## css2atomic 

>自将xml和css中的样式属性替换成原子化的自动化工具


### 使用方法
- 安装
```
npm i -g css2atomic
```
- 使用
```shell
##进入项目根目录 在命令行中输入指令
$ css2atomic 

##输入原子化样式路径，以相对项目根目录的相对路径输入
? 请输入作为标准的原子化样式文件的相对路径 ./platforms/ec/main/styles/app.wxss

## 输入你要对比的页面文件的json 或者 目录路径（相对项目根目录）
? 请选择目标样式对应的json或文件夹 (./packages|./packages/order/detail.json)

```

- 检查
工具检索出来的代码变化非常多，需要人工核对确保代码正常运行



## 示例

*原子化样式*
```
.bg-w{
    background:#ddd
}
```
*已经存在的代码*
```
<view class="box">123</view>
<style>
.box{
  font-size:20rpx;
  background:#ddd
}
</style>   
```
*css2atomaic 处理后的代码*
```
<view class="box bg-w">123</view>
<style>
.box{
  font-size:20rpx;
}
</style>   
```

> 可以看到处理后xml和css都有一处变化  
> xml中`class`属性中增加了新的类名 `bg-w`  
> css中`.box`中被删除掉了一条与原子化样式重复的`background`属性


## 原理简介
1. 通过传入的入口文件夹或者入口地址，创建文件树，分析页面与组件依赖关系
1. 将 原子化css文件和项目中需要替换的目标css文件都转化成 CSS-in-JS
1. 对比两个css查出重复的css属性键值对，标记选择器
1. 解析xml转换为JSDom,方便操作
1. 增删dom中选择器，删除目标css中的重复样式
1. CSS-in-Js 还原文本，JSDom还原文本。



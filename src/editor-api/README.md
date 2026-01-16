# api 返回样式

请求 /api/list  
方法 GET
参数：
url_
name: 文件夹名称
返回 JSON {
  data: Array<name: string, isdir: boolean>
}
请求：/api/get
方法 GET
参数：
url_
name: 返回的文件的文件名
返回 JSON {
  data: string
}
请求 /api/set
方法：POST
参数：
body
name：修改的文件的文件名
content：修改后的内容
返回 JSON {
  data: 成功 ? 'ok' : any
}
请求 /api/delete
方法：POST
参数：
body
name：删除的文件的文件名
返回 JSON {
  data: 成功 ? 'ok' : any
}
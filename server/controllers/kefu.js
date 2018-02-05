async function get(ctx, next) {
  console.log("kefu:", ctx.request.body);
}


async function post(ctx, next) {
  console.log("kefu:", ctx.request.body);
}

module.exports = {
  post,
  get
}
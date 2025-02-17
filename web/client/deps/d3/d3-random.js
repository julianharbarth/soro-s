var defaultSource = Math.random;
var uniform = function sourceRandomUniform(source) {
  function randomUniform(min, max) {
    min = min == null ? 0 : +min;
    max = max == null ? 1 : +max;
    if (arguments.length === 1)
      max = min, min = 0;
    else
      max -= min;
    return function() {
      return source() * max + min;
    };
  }
  randomUniform.source = sourceRandomUniform;
  return randomUniform;
}(defaultSource);
var int = function sourceRandomInt(source) {
  function randomInt(min, max) {
    if (arguments.length < 2)
      max = min, min = 0;
    min = Math.floor(min);
    max = Math.floor(max) - min;
    return function() {
      return Math.floor(source() * max + min);
    };
  }
  randomInt.source = sourceRandomInt;
  return randomInt;
}(defaultSource);
var normal = function sourceRandomNormal(source) {
  function randomNormal(mu, sigma) {
    var x, r;
    mu = mu == null ? 0 : +mu;
    sigma = sigma == null ? 1 : +sigma;
    return function() {
      var y;
      if (x != null)
        y = x, x = null;
      else
        do {
          x = source() * 2 - 1;
          y = source() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
      return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
    };
  }
  randomNormal.source = sourceRandomNormal;
  return randomNormal;
}(defaultSource);
var logNormal = function sourceRandomLogNormal(source) {
  var N = normal.source(source);
  function randomLogNormal() {
    var randomNormal = N.apply(this, arguments);
    return function() {
      return Math.exp(randomNormal());
    };
  }
  randomLogNormal.source = sourceRandomLogNormal;
  return randomLogNormal;
}(defaultSource);
var irwinHall = function sourceRandomIrwinHall(source) {
  function randomIrwinHall(n) {
    if ((n = +n) <= 0)
      return () => 0;
    return function() {
      for (var sum = 0, i = n; i > 1; --i)
        sum += source();
      return sum + i * source();
    };
  }
  randomIrwinHall.source = sourceRandomIrwinHall;
  return randomIrwinHall;
}(defaultSource);
var bates = function sourceRandomBates(source) {
  var I = irwinHall.source(source);
  function randomBates(n) {
    if ((n = +n) === 0)
      return source;
    var randomIrwinHall = I(n);
    return function() {
      return randomIrwinHall() / n;
    };
  }
  randomBates.source = sourceRandomBates;
  return randomBates;
}(defaultSource);
var exponential = function sourceRandomExponential(source) {
  function randomExponential(lambda) {
    return function() {
      return -Math.log1p(-source()) / lambda;
    };
  }
  randomExponential.source = sourceRandomExponential;
  return randomExponential;
}(defaultSource);
var pareto = function sourceRandomPareto(source) {
  function randomPareto(alpha) {
    if ((alpha = +alpha) < 0)
      throw new RangeError("invalid alpha");
    alpha = 1 / -alpha;
    return function() {
      return Math.pow(1 - source(), alpha);
    };
  }
  randomPareto.source = sourceRandomPareto;
  return randomPareto;
}(defaultSource);
var bernoulli = function sourceRandomBernoulli(source) {
  function randomBernoulli(p) {
    if ((p = +p) < 0 || p > 1)
      throw new RangeError("invalid p");
    return function() {
      return Math.floor(source() + p);
    };
  }
  randomBernoulli.source = sourceRandomBernoulli;
  return randomBernoulli;
}(defaultSource);
var geometric = function sourceRandomGeometric(source) {
  function randomGeometric(p) {
    if ((p = +p) < 0 || p > 1)
      throw new RangeError("invalid p");
    if (p === 0)
      return () => Infinity;
    if (p === 1)
      return () => 1;
    p = Math.log1p(-p);
    return function() {
      return 1 + Math.floor(Math.log1p(-source()) / p);
    };
  }
  randomGeometric.source = sourceRandomGeometric;
  return randomGeometric;
}(defaultSource);
var gamma = function sourceRandomGamma(source) {
  var randomNormal = normal.source(source)();
  function randomGamma(k, theta) {
    if ((k = +k) < 0)
      throw new RangeError("invalid k");
    if (k === 0)
      return () => 0;
    theta = theta == null ? 1 : +theta;
    if (k === 1)
      return () => -Math.log1p(-source()) * theta;
    var d = (k < 1 ? k + 1 : k) - 1 / 3, c = 1 / (3 * Math.sqrt(d)), multiplier = k < 1 ? () => Math.pow(source(), 1 / k) : () => 1;
    return function() {
      do {
        do {
          var x = randomNormal(), v = 1 + c * x;
        } while (v <= 0);
        v *= v * v;
        var u = 1 - source();
      } while (u >= 1 - 0.0331 * x * x * x * x && Math.log(u) >= 0.5 * x * x + d * (1 - v + Math.log(v)));
      return d * v * multiplier() * theta;
    };
  }
  randomGamma.source = sourceRandomGamma;
  return randomGamma;
}(defaultSource);
var beta = function sourceRandomBeta(source) {
  var G = gamma.source(source);
  function randomBeta(alpha, beta2) {
    var X = G(alpha), Y = G(beta2);
    return function() {
      var x = X();
      return x === 0 ? 0 : x / (x + Y());
    };
  }
  randomBeta.source = sourceRandomBeta;
  return randomBeta;
}(defaultSource);
var binomial = function sourceRandomBinomial(source) {
  var G = geometric.source(source), B = beta.source(source);
  function randomBinomial(n, p) {
    n = +n;
    if ((p = +p) >= 1)
      return () => n;
    if (p <= 0)
      return () => 0;
    return function() {
      var acc = 0, nn = n, pp = p;
      while (nn * pp > 16 && nn * (1 - pp) > 16) {
        var i = Math.floor((nn + 1) * pp), y = B(i, nn - i + 1)();
        if (y <= pp) {
          acc += i;
          nn -= i;
          pp = (pp - y) / (1 - y);
        } else {
          nn = i - 1;
          pp /= y;
        }
      }
      var sign = pp < 0.5, pFinal = sign ? pp : 1 - pp, g = G(pFinal);
      for (var s = g(), k = 0; s <= nn; ++k)
        s += g();
      return acc + (sign ? k : nn - k);
    };
  }
  randomBinomial.source = sourceRandomBinomial;
  return randomBinomial;
}(defaultSource);
var weibull = function sourceRandomWeibull(source) {
  function randomWeibull(k, a, b) {
    var outerFunc;
    if ((k = +k) === 0) {
      outerFunc = (x) => -Math.log(x);
    } else {
      k = 1 / k;
      outerFunc = (x) => Math.pow(x, k);
    }
    a = a == null ? 0 : +a;
    b = b == null ? 1 : +b;
    return function() {
      return a + b * outerFunc(-Math.log1p(-source()));
    };
  }
  randomWeibull.source = sourceRandomWeibull;
  return randomWeibull;
}(defaultSource);
var cauchy = function sourceRandomCauchy(source) {
  function randomCauchy(a, b) {
    a = a == null ? 0 : +a;
    b = b == null ? 1 : +b;
    return function() {
      return a + b * Math.tan(Math.PI * source());
    };
  }
  randomCauchy.source = sourceRandomCauchy;
  return randomCauchy;
}(defaultSource);
var logistic = function sourceRandomLogistic(source) {
  function randomLogistic(a, b) {
    a = a == null ? 0 : +a;
    b = b == null ? 1 : +b;
    return function() {
      var u = source();
      return a + b * Math.log(u / (1 - u));
    };
  }
  randomLogistic.source = sourceRandomLogistic;
  return randomLogistic;
}(defaultSource);
var poisson = function sourceRandomPoisson(source) {
  var G = gamma.source(source), B = binomial.source(source);
  function randomPoisson(lambda) {
    return function() {
      var acc = 0, l = lambda;
      while (l > 16) {
        var n = Math.floor(0.875 * l), t = G(n)();
        if (t > l)
          return acc + B(n - 1, l / t)();
        acc += n;
        l -= t;
      }
      for (var s = -Math.log1p(-source()), k = 0; s <= l; ++k)
        s -= Math.log1p(-source());
      return acc + k;
    };
  }
  randomPoisson.source = sourceRandomPoisson;
  return randomPoisson;
}(defaultSource);
const mul = 1664525;
const inc = 1013904223;
const eps = 1 / 4294967296;
function lcg(seed = Math.random()) {
  let state = (0 <= seed && seed < 1 ? seed / eps : Math.abs(seed)) | 0;
  return () => (state = mul * state + inc | 0, eps * (state >>> 0));
}
export {bates as randomBates, bernoulli as randomBernoulli, beta as randomBeta, binomial as randomBinomial, cauchy as randomCauchy, exponential as randomExponential, gamma as randomGamma, geometric as randomGeometric, int as randomInt, irwinHall as randomIrwinHall, lcg as randomLcg, logNormal as randomLogNormal, logistic as randomLogistic, normal as randomNormal, pareto as randomPareto, poisson as randomPoisson, uniform as randomUniform, weibull as randomWeibull};
export default null;

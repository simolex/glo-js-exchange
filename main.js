"use strict";

const baseURL = "http://api.exchangeratesapi.io/v1/";
const queryConvert = {};
const queryRates = {};

const getData = (url) => {
  url.searchParams.append("access_key", getToken());
  const hrefURL = url.href;
  return fetch(hrefURL).then((response) => {
    console.log(hrefURL);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(response.statusText);
    }
  });
};

const getAllSymbols = async () => {
  const symbolsURL = new URL("./symbols", baseURL);

  let data = localStorage.getItem("exchangeratesapi_symbols")
    ? JSON.parse(localStorage.getItem("exchangeratesapi_symbols"))
    : await getData(symbolsURL);

  if (data && data.success) {
    localStorage.setItem("exchangeratesapi_symbols", JSON.stringify(data.symbols));
    data = data.symbols;
  }
  return data;
};

const requestRates = async (from, to) => {
  const convertsURL = new URL("./latest", baseURL);
  const arrRates = [];
  const nowDate = new Date().toISOString().substring(0, 10);

  let { date, rates } = localStorage.getItem("exchangeratesapi_rates")
    ? JSON.parse(localStorage.getItem("exchangeratesapi_rates"))
    : { date: "" };

  if (date !== nowDate) {
    arrRates.push(from);
    arrRates.push(to);
    date = nowDate;
    rates = {};
  } else {
    if (!rates[from]) {
      arrRates.push(from);
    }
    if (!rates[to]) {
      arrRates.push(to);
    }
  }
  if (arrRates.length > 0) {
    convertsURL.searchParams.append("symbols", arrRates.join(","));
    const requestRates = await getData(convertsURL);
    if (requestRates.success) {
      arrRates.forEach((symbol) => {
        rates[symbol] = requestRates.rates[symbol];
      });
    }
  }

  localStorage.setItem("exchangeratesapi_rates", JSON.stringify({ date, rates }));
  return { date, rates };
};

const applySelect = (elementSelect, key) => {
  getAllSymbols()
    .then((data) => {
      for (let symbol in data) {
        if (!queryConvert[key]) {
          queryConvert[key] = symbol;
        }
        const option = document.createElement("option");
        option.value = symbol;
        option.textContent = `${symbol} - ${data[symbol]}`;
        elementSelect.append(option);
      }
    })
    .catch((e) => {
      console.log(e.message);
    });
  elementSelect.addEventListener("change", (e) => {
    queryConvert[key] = e.target.value;
    //console.log(queryConvert);
  });
};

const applyInput = (elementInput, key) => {
  elementInput.value = 0;
  queryConvert[key] = elementInput;
  elementInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[\D]/gi, "");
  });
};

applySelect(document.getElementById("symbol_from"), "symbol_from");
applySelect(document.getElementById("symbol_to"), "symbol_to");
applyInput(document.getElementById("amount_from"), "input_from");
applyInput(document.getElementById("amount_to"), "input_to");

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  requestRates(queryConvert.symbol_from, queryConvert.symbol_to)
    .then((data) => {
      let { rates } = data;
      queryConvert.input_to.value =
        (rates[queryConvert.symbol_to] / rates[queryConvert.symbol_from]) * +queryConvert.input_from.value;
    })
    .catch((e) => {
      console.log(e.message);
    });
});

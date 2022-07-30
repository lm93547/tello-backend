function handleError(err) {
    if (err) {
      console.log('ERROR');
      console.log(err);
    } else {
        return {status: "ok"}
    }
}

function parseState(state) {
    return state
      .split(';')
      .map(x => x.split(':'))
      .reduce((data, [key, value]) => {
        data[key] = value;
        return data;
      }, {});
}

module.exports = {handleError, parseState};
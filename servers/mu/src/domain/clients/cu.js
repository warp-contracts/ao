function resultWith ({ fetch, CU_URL, logger }) {
  return async (txId, processId) => {
    const cuUrl = processId === 'Iny8fK0S1FCSVVOIWubg2L9EXV1RFaxgRJwv5-mwEYk'
      ? 'https://cu.ao-testnet.xyz'
      : CU_URL

    logger(`${cuUrl}/result/${txId}?process-id=${processId}&no-busy=1`)

    const requestOptions = {
      timeout: 0
    }

    return fetch(`${cuUrl}/result/${txId}?process-id=${processId}&no-busy=1`, requestOptions)
      .then(res => res.json())
      .then(res => res || {
        Messages: [],
        Spawns: [],
        Assignments: [],
        Output: ''
      })
  }
}

function selectNodeWith ({ CU_URL, logger }) {
  return async (processId) => {
    logger(`Selecting cu for process ${processId}`)
    if (processId === 'Iny8fK0S1FCSVVOIWubg2L9EXV1RFaxgRJwv5-mwEYk') {
      return 'https://cu.ao-testnet.xyz'
    }
    return CU_URL
  }
}

function fetchCronWith ({ CU_URL, logger }) {
  return async ({ processId, cursor }) => {
    let requestUrl = `${CU_URL}/cron/${processId}`
    if (cursor) {
      requestUrl = `${CU_URL}/cron/${processId}?from=${cursor}&limit=50`
    }
    logger(`Fetching cron: ${requestUrl}`)
    return fetch(requestUrl).then(r => r.json()
      .catch(error => {
        logger(`Failed to parse cron JSON: ${error.toString()}`)
        return { edges: [] }
      }))
  }
}

export default {
  fetchCronWith,
  resultWith,
  selectNodeWith
}

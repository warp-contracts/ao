const AO_TESTNET_PROCESS = [
  'AiMTGB8qLZUo3Do9x4vJCCWa-APVxBBoI2KX1jwYQH0',
  'rH_-7vT_IgfFWiDsrcTghIhb9aRclz7lXcK7RCOV2h8',
  'Us4BVLXDjtRz7Qzf7osnNcxTsi4vEjfMWo1RRTzhigQ',
  'KvQhYDJTQwpS3huPUJy5xybUDN3L8SE1mhLOBAt5l6Y',
  'fev8nSrdplynxom78XaQ65jSo7-88RxVVVPwHG8ffZk'
]

function resultWith ({ fetch, CU_URL, logger }) {
  return async (txId, processId) => {
    const cuUrl = AO_TESTNET_PROCESS.includes(processId)
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

// TODO: doesn't seem to be used
function selectNodeWith ({ CU_URL, logger }) {
  return async (processId) => {
    logger(`Selecting cu for process ${processId}`)
    if (AO_TESTNET_PROCESS.includes(processId)) {
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

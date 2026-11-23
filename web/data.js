window.AGENTGUARD_SNAPSHOT = {
  "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
  "agent": {
    "name": "AgentGuard Sentinel",
    "description": "Market-brief agent that pays per request over x402 under an owner-set spend cap, allowlist and expiry.",
    "endpoint": "https://github.com/Jarvis-184/agentguard"
  },
  "erc8004Agents": 0,
  "payments": [
    {
      "hash": "0x2e6a7322a527d692e6c4e705389a78fd18334ddcb1400c817fc759b762004ec4",
      "to": "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f",
      "amountUsdt": "0.005",
      "block": 42115667,
      "tagged": false
    },
    {
      "hash": "0x27c6481286211b3849ad2e94eb73d995bc3d7fbb54ed93fd2cbd1c1ab9edbc6b",
      "to": "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f",
      "amountUsdt": "0.005",
      "block": 42115717,
      "tagged": false
    },
    {
      "hash": "0x3e4995451f6c89d8116fcde7014edd1e0bc35b0d3898cff0efd21bb83c52876b",
      "to": "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f",
      "amountUsdt": "0.005",
      "block": 42115753,
      "tagged": true
    }
  ],
  "jobs": [
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-22T23:11:50.874Z"
      }
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-22T23:11:59.829Z"
      },
      "jobUrl": "https://gateway.usebuy.ai/v1/social/youtube/videos/search"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-22T23:12:02.771Z"
      },
      "jobUrl": "https://gateway.usebuy.ai/v1/social/youtube/videos/search"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-22T23:13:43.722Z"
      },
      "jobUrl": "https://gateway.usebuy.ai/v1/social/youtube/videos/search"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "paidAt": "2026-11-22T23:13:44.080Z",
      "status": 405,
      "body": "{\"error\":\"method_not_allowed\"}"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-22T23:13:55.725Z"
      },
      "jobUrl": "https://gateway.usebuy.ai/v1/social/youtube/videos/search"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "paidAt": "2026-11-22T23:13:56.056Z",
      "status": 402,
      "body": "{\"x402Version\":1,\"accepts\":[{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0xcebA9300f2b948710d2653dD7B07f33A8B32118C\",\"extra\":{\"name\":\"USDC\",\"version\":\"2\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e\",\"extra\":{\"name\":\"Tether USD\",\"version\":\"1\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771\",\"extra\":{\"name\":\"Tether America USD\",\"version\":\"1\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo-sepolia\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway (sandbox: Celo Sepolia test funds)\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0x01C5C0122039549AD1493B8220cABEdD739BC44E\",\"extra\":{\"name\":\"USDC\",\"version\":\"2\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-23T02:00:38.935Z"
      },
      "jobUrl": "https://gateway.usebuy.ai/v1/social/youtube/videos/search"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "paidAt": "2026-11-23T02:00:39.419Z",
      "status": 402,
      "body": "{\"x402Version\":1,\"accepts\":[{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0xcebA9300f2b948710d2653dD7B07f33A8B32118C\",\"extra\":{\"name\":\"USDC\",\"version\":\"2\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e\",\"extra\":{\"name\":\"Tether USD\",\"version\":\"1\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0xD2ab3C9A02DBBAB236BfEC45D1d755DF4267F771\",\"extra\":{\"name\":\"Tether America USD\",\"version\":\"1\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub\",\"pricingModel\":\"per_call\"}}},{\"scheme\":\"exact\",\"network\":\"celo-sepolia\",\"maxAmountRequired\":\"5000\",\"resource\":\"https://gateway.usebuy.ai/v1/social/youtube/videos/search\",\"description\":\"Search YouTube videos through buy-gateway (sandbox: Celo Sepolia test funds)\",\"mimeType\":\"application/json\",\"payTo\":\"0x20faAca5F980E29639A0FCC6dcA6988E18ed333B\",\"maxTimeoutSeconds\":300,\"asset\":\"0x01C5C0122039549AD1493B8220cABEdD739BC44E\",\"extra\":{\"name\":\"USDC\",\"version\":\"2\",\"gateway\":{\"capability\":\"youtube.videos.search\",\"provider\":\"tikhub"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-23T02:08:23.728Z"
      }
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "paidAt": "2026-11-23T02:08:26.773Z",
      "paidUnits": "5000",
      "merchant": "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f",
      "facilitator": "https://api.x402.sepolia.celo.org",
      "tx": "0x27c6481286211b3849ad2e94eb73d995bc3d7fbb54ed93fd2cbd1c1ab9edbc6b",
      "explorer": "https://celo-sepolia.blockscout.com/tx/0x27c6481286211b3849ad2e94eb73d995bc3d7fbb54ed93fd2cbd1c1ab9edbc6b",
      "status": "success",
      "block": "42115717"
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "decision": {
        "ok": true,
        "reason": "within policy",
        "checkedAt": "2026-11-23T02:08:59.032Z"
      }
    },
    {
      "wallet": "0x6f59ab1977DF350d1FbBE379EEE6D45AEB766353",
      "paidAt": "2026-11-23T02:09:03.119Z",
      "paidUnits": "5000",
      "merchant": "0x8Ced59c00F99d6892f181979EE1de3F07BCEDb0f",
      "facilitator": "https://api.x402.sepolia.celo.org",
      "tx": "0x3e4995451f6c89d8116fcde7014edd1e0bc35b0d3898cff0efd21bb83c52876b",
      "explorer": "https://celo-sepolia.blockscout.com/tx/0x3e4995451f6c89d8116fcde7014edd1e0bc35b0d3898cff0efd21bb83c52876b",
      "status": "success",
      "block": "42115753"
    }
  ],
  "generatedAt": "2026-11-23T02:09:24.738Z"
};

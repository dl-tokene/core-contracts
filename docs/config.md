### Config file structure

```
{
  "roles": {
    "SOME_ROLE1": {
      "allow": [
        {
          "resource": "RESOURCE_NAME",
          "permissions": ["RESOURCE_PERMISSION_NAME"]
        }
      ],
      "reject": [
        {
          "resource": "OTHER_RESOURCE_NAME",
          "permissions": ["OTHER_RESOURCE_PERMISSION_NAME"]
        }
      ]
    }
  },
  "addresses": {
    "0x0000000000000000000000000000000000000001": ["MASTER"],
    "0x0000000000000000000000000000000000000002": ["SOME_ROLE1"]
  },
  "constants": {
    "DURATION": {
      "value": "86400",
      "type": "uint256"
    }
  }
}
```

Please note that the `MASTER` role has to be specified explicitly.

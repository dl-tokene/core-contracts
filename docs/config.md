### Config file structure

```
{
  "projectName": "PROJECT_NAME",
  "roles": {
    "SOME_ROLE1": {
      "description": "This is an important role",
      "allow": [
        {
          "resource": "RESOURCE_NAME",
          "permissions": ["RESOURCE_PERMISSION_NAME"]
        }
      ],
      "disallow": [
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

Please note that the `MASTER` role assignment has to be specified explicitly, else you will not have a master admin in your system.

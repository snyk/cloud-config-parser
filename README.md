![Snyk logo](https://snyk.io/style/asset/logo/snyk-print.svg)

***

# Snyk snyk-config-parser

A utility library for finding issues in configuration files
This library is being used as part of snyk cloud configuration product.

## How it works

The library receives a path (array of strings), a file type (YAML/JSON) and the configuration file content and it returns the number of the line which is the closest to the path received.
In case that the full path does not exist - the returned line number will correspond to the deepest entry in the path array that was found.


## Examples:  

---

For the received path: 

- ```['spec', 'template', 'spec', 'containers[0]', 'nonExistingResource', 'securityContext', 'capabilities']``` 

It will return the line number of the first element in the containers array (because nonExistingResource does not exist).

For the received path: 

- ```['spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']```

It will return the line number of 'capabilities'.


### Elements with array:
---

Until now, the paths received in the Cloud Config issues were `containers[snyky1]`, where `snyky1` was the value of the `name` property in one of the objects in `containers`.  

We are supporting both `containers[snyky1]` and `containers[0]`, while the new issues will be in the format of `containers[0]`.

The piece of code that creates the paths is creating elements like `containers[0]`, but in cases of `containers[snyky1]`, it goes over the elements of the array and looks for a sub-element with key: `name` and value `snyky1`.  


### **Paths starting with 'input'**  
---

For example:  

```['input', 'spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']```

The input value will be removed and the path we are looking for will be like this:  

```['spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']```

### **Yaml DocId:**
---

- In the case that the files are JSON or single Yaml - the `DocId` will be `0`.  
- In the case of a multi-document file - the `DocId` will be according to the order of the documets.


### Line numbers
---
Are 1 based!


### Keys - not value
---

We are looking for the key in the path and not the value.

For example - `drop` may have multiple values as an array of strings. We can show `drop[0]` as the first array of values but not `drop['192.168.0.1']`.


## How to run locally

Unlike CCPS and CCPE, the Parser is a **library** and not a service. It is responsible for identifying the issue path in the file return the relevant line number in order to highlight the relevant line to the users in their files.

- At the parser directory run `npm link`
- At Registry directory run `npm link @snyk/cloud-config-parser`
- Build your registry project `npm run build`
- Run Registry through the parser


## How to deploy

- Your PR is approved
- Hit merge and the commit will be automatically deployed to `master`. We don't have more environments for the parser, so that's it.
- At registry directory, update the `package.json` file with the new version, e.g. ```"@snyk/cloud-config-parser": "^x.y.z"```

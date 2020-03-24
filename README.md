![Snyk logo](https://snyk.io/style/asset/logo/snyk-print.svg)

***

# Snyk snyk-config-parser
A utility library for finding issues in configuration files
This library is being used as part of snyk cloud configuration product.

The library receives a path (array of strings), file type (YAML/JSON) and the configuration file content and return the number of the line which is the closest to the path received.
In case that the full path is not exists - the returned line number will be of the latest value in the path array that was found.

### Example:  
For the received path  
['spec', 'template', 'spec', 'containers[0]', 'nonExistingResource', 'securityContext', 'capabilities']. 
Will return the line number of the first element in the containers array (because nonExistingResource not exists)

['spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']. 
Will return the line number of 'capabilities'.


### **Elements with array:**
Until now the paths received in the Cloud Config issues where 'containers[snyky1]' where 'snyky1' were the value of the name property in one of the objects in 'containers'.  
We are supporting both 'containers[snyky1]' and 'containers[0]', while the new issues will be in the format of 'containers[0]'.
The code that creating the paths is creating elements like 'containers[0]' but in cases of 'containers[snyky1]' it goes over the elements in the array and looking for a sub-element with key: 'name' and value 'snyky1'.  

### **Paths starting with 'input'**,  
such as:  
['input', 'spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']  
The input value will be removed and the path we are looking for will be as follows:  
['spec', 'template', 'spec', 'containers[0]', 'resources', 'securityContext', 'capabilities']  

### **Yaml DocId:**
In case that the files are JSON or single Yaml - the DocId will be 0.  
In case of multi-document file - the DocId will be according to the order of the documets.

### Line numbers
Are 1 based!

### Keys not value
We are looking for the key in the path and not the value.  
For example - 'drop' may have multiple values as array of strings. We can show drop[0] as the first array of values but not drop['192.168.0.1'].

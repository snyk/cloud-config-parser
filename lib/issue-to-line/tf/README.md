# Terraform File (.TF) Parser

There is no `TF` parser which gives the line number and type for each line in Terraform file.
Therefore, we had to create our own parser that do so.

## TF file structure

### Ignored Lines
* Comment line - Starting with `#`
* Comment line - Starting with `//`
* Comment lines - Starting with `/*` and ends with `*/`
* Multi-line array and strings - wea are only looking on the first line and need to ignore the rest of the lines, until the relevant object ends.

    **Multi lines objects**
    * Array - Starts with `[` and the `]` is in separate line.
        For example:
        ```
        cidr_block: [0.0.0.1/0,
                     0.0.0.2/0,
                     0.0.0.3/0]
        ```
    * String - Starts with `<<` afterwards arrive a word `XXX` and the string ends in a line contains this word again.
    For Example:
        ```
        text = << EOF My text here
                is a long text
                in multiple lines
                EOF
        ```
        
## TF Object Types

### Simple objects types
* String
    ```
    name        = "allow_tcp"
    ```
* Array
    ```
    cidr_blocks = ["::/0"]
    ```

### Object
comma-phrase-for name and brackets - `{name} {`
```
ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["::/0"]
}
```

Object without content - can exist ` ingress {}` and will be declared in the same line
    
### Type
comma-phrase-for object type and object-kind, can contain also name, which is optional - `{type} {kind} {name-optional} {`
```
provider "aws" { // Type without name
  region = "${var.aws_region}"
}

resource "aws_vpc" "default" { //Type with name
  cidr_block = "10.0.0.0/16"
}
```

Type without content - can exist ` provider "aws" {}` and will be declared in the same line
Type and kind must exist


## How the parser works (pseudo code):

#### Parser:
1. Split the file into lines
2. foreach line
    2.1. lineState -> getLineState(line)
    2.2. if lineState.ignoreLine
        2.2.1. continue
    2.3. lineType -> getLineType(line)
    2.4. handleLeLineForType(line, lineType)

#### getLineState: 
1. check if ignore line
2. check if ignore multi-line comment
3. check if in multi-line string

#### getLineType:
Check for each case what type it can be according to the signs - `[`,`]`,`{`,`}`,`=`
Understand if this is a `type`, `object`, `array`, `string` and if this object is `start`,`end` or `start_and_and`.

### handleLeLineForType:
For each `lineType`
    Check that this type is valid in order
    if `start` type - create relevant `node` and add it to `stateQueue`
    if `end` type - remove from `stateQueue`
    if `start_and_end` type - only create relevant `node`
Check that `stateQueue` is empty
return Nodes

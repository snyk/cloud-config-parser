# Specify the provider and access details
provider "aws" {
  region = "${var.aws_region}"
}
/*
# Create a VPC to launch our instances into
resource "aws_vpc" "default" {
  cidr_block = "10.0.0.0/16"
}

# Create an internet gateway to give our subnet access to the outside world
resource "aws_internet_gateway" "default" {
  vpc_id = "${aws_vpc.default.id}"
}
*/
resource "aws_security_group" "allow_tcp" {
  name        = "allow_tcp"
  description = "Allow TCP inbound from anywhere"
  vpc_id      = "${aws_vpc.main.id}"

  ingress = {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["::/0"]
  }
  // Egress comment
  egress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["::/0",
                   "0.0.0.0:0"]
    test = << EOF String
      long one
      EOF
  }

  test {}
}

resource "aws_internet_gateway" "default" {}

resource "aws_security_group" "with_multi_line_array" {
  name        = "allow_tcp"
  description = "Allow TCP inbound from anywhere"
  vpc_id      = "${aws_vpc.main.id}"

  ingress = {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = [
      "::/0"
    ]
  }
}
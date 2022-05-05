import { readFileSync } from 'fs';
import { issuesToLineNumbers } from '../../lib/issue-to-line/index';
import { CloudConfigFileTypes } from '../../lib/types';

describe('TF Parser - working TF file with comments - single resource', () => {
  const simpleTF = 'test/fixtures/tf/single.tf';
  const simpleTFContent = readFileSync(simpleTF).toString();

  test('Path resource with name - full path exists', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_tcp]',
      'vpc_id',
    ];

    expect(
      issuesToLineNumbers(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(19);
  });

  test('Path resource in object', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_tcp]',
      'ingress',
      'cidr_blocks',
    ];

    expect(
      issuesToLineNumbers(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(25);
  });

  test('Path resource - full path not exists', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_tcp]',
      'egress',
      'NoExists',
    ];

    expect(
      issuesToLineNumbers(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(28);
  });

  test('Path provider - type without name', () => {
    const path: string[] = ['provider', 'aws', 'region'];

    expect(
      issuesToLineNumbers(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(3);
  });
});

describe('TF Parser - Multiple resources', () => {
  const multiTF = 'test/fixtures/tf/multi-resource.tf';
  const multiTFContent = readFileSync(multiTF).toString();
  test('First resource in multi resource env', () => {
    const path: string[] = ['resource', 'aws_vpc[default]', 'cidr_block'];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(8);
  });

  test('Second resource in multi resource env - not same type', () => {
    const path: string[] = [
      'resource',
      'aws_internet_gateway[default]',
      'vpc_id',
    ];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(13);
  });

  test('Resource with same subtype and different name', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_ssh_with_valid_cidr]',
      'ingress',
      'cidr_blocks',
    ];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(38);
  });

  test('Path provider', () => {
    const path: string[] = ['provider', 'aws', 'region'];

    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(3);
  });
});

describe('TF Parser - File with terraform object', () => {
  const multiTF = 'test/fixtures/tf/with-terraform-object.tf';
  const multiTFContent = readFileSync(multiTF).toString();
  test('Terraform object', () => {
    const path: string[] = ['terraform', 'required_version'];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(6);
  });

  test('Terraform object', () => {
    const path: string[] = [
      'module',
      'gke_cluster',
      'master_authorized_networks_config',
      'cidr_blocks',
    ];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(70);
  });
});

describe('TF Parser - File with locals object', () => {
  const multiTF = 'test/fixtures/tf/with-terraform-object.tf';
  const multiTFContent = readFileSync(multiTF).toString();
  test('Locals object existence and parsable', () => {
    const path: string[] = ['locals', 'common_tags', 'Service'];
    expect(
      issuesToLineNumbers(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(12);
  });
});

describe('TF Parser - File with function object', () => {
  test('The correct line number is returned for issues found in file with function object', () => {
    const functionTF = 'test/fixtures/tf/with-function.tf';
    const functionTFContent = readFileSync(functionTF).toString();

    const path: string[] = ['resource', 'aws_kms_key[efs]', 'is_enabled'];
    expect(
      issuesToLineNumbers(functionTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(4);
  });

  test('The correct line number is returned for issues found in file with function object inside other function', () => {
    const functionTF = 'test/fixtures/tf/with-two-functions.tf';
    const functionTFContent = readFileSync(functionTF).toString();

    const path: string[] = ['resource', 'aws_kms_key[efs]', 'is_enabled'];
    expect(
      issuesToLineNumbers(functionTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(4);
  });

  test('The correct line number is returned for issues found in file with function object', () => {
    const functionTF = 'test/fixtures/tf/with-function-after-brackets.tf';
    const functionTFContent = readFileSync(functionTF).toString();

    const path: string[] = ['resource', 'aws_kms_key[efs]', 'is_enabled'];
    expect(
      issuesToLineNumbers(functionTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(4);
  });

  test('The correct line number is returned in the case of 2 fields starting with the same string', () => {
    const fileName = 'test/fixtures/tf/with_two_references.tf';
    const tfContent = readFileSync(fileName).toString();
    const path: string[] = [
      'resource',
      'azurerm_virtual_machine[denied_3]',
      'os_profile',
      'admin_password',
    ];

    expect(
      issuesToLineNumbers(tfContent, CloudConfigFileTypes.TF, path),
    ).toEqual(9);
  });
});

describe('TF Parser - Broken TF', () => {
  test('Broken JSON - cut in the middle of an object', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_tcp]',
      'description',
    ];

    const filePath = 'test/fixtures/tf/broken-object.tf';
    const fileContent = readFileSync(filePath).toString();
    expect(() => {
      issuesToLineNumbers(fileContent, CloudConfigFileTypes.TF, path);
    }).toThrowError('Invalid TF input');
  });

  test('Broken JSON - cut in the middle of an object', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_tcp]',
      'description',
    ];

    const filePath = 'test/fixtures/tf/broken-invalid-type.tf';
    const fileContent = readFileSync(filePath).toString();
    expect(() => {
      issuesToLineNumbers(fileContent, CloudConfigFileTypes.TF, path);
    }).toThrowError('Invalid TF input');
  });

  test('Broken TF - empty', () => {
    const path: string[] = ['resource', 'aws_security_group[allow_tcp]'];

    expect(() => {
      issuesToLineNumbers('', CloudConfigFileTypes.TF, path);
    }).toThrowError('Invalid TF input');
  });
});

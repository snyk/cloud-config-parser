import { readFileSync } from 'fs';
import { issuePathToLineNumber } from '../../lib/issue-to-line/index';
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
      issuePathToLineNumber(simpleTFContent, CloudConfigFileTypes.TF, path),
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
      issuePathToLineNumber(simpleTFContent, CloudConfigFileTypes.TF, path),
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
      issuePathToLineNumber(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(28);
  });

  test('Path provider - type without name', () => {
    const path: string[] = ['provider', 'aws', 'region'];

    expect(
      issuePathToLineNumber(simpleTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(3);
  });
});

describe('TF Parser - Multiple resources', () => {
  const multiTF = 'test/fixtures/tf/multi-resource.tf';
  const multiTFContent = readFileSync(multiTF).toString();
  test('First resource in multi resource env', () => {
    const path: string[] = ['resource', 'aws_vpc[default]', 'cidr_block'];
    expect(
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(8);
  });

  test('Second resource in multi resource env - not same type', () => {
    const path: string[] = [
      'resource',
      'aws_internet_gateway[default]',
      'vpc_id',
    ];
    expect(
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(13);
  });

  test('Resource with same subtype and different name', () => {
    const path: string[] = [
      'resource',
      'aws_security_group[allow_ssh_with_valid_cidr]',
      'ingress',
      'cidr_block',
    ];
    expect(
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(38);
  });

  test('Path provider', () => {
    const path: string[] = ['provider', 'aws', 'region'];

    expect(
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(3);
  });
});

describe('TF Parser - File with terraform object', () => {
  const multiTF = 'test/fixtures/tf/with-terraform-object.tf';
  const multiTFContent = readFileSync(multiTF).toString();
  test('Terraform object', () => {
    const path: string[] = ['terraform', 'required_version'];
    expect(
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
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
      issuePathToLineNumber(multiTFContent, CloudConfigFileTypes.TF, path),
    ).toEqual(62);
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
      issuePathToLineNumber(fileContent, CloudConfigFileTypes.TF, path);
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
      issuePathToLineNumber(fileContent, CloudConfigFileTypes.TF, path);
    }).toThrowError('Invalid TF input');
  });

  test('Broken TF - empty', () => {
    const path: string[] = ['resource', 'aws_security_group[allow_tcp]'];

    expect(() => {
      issuePathToLineNumber('', CloudConfigFileTypes.TF, path);
    }).toThrowError('Invalid TF input');
  });
});

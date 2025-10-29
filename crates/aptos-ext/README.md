# Aptos Ext

## Summary

This is CLI is intended as an extension to the [aptos](https://github.com/aptos-labs/aptos-core/tree/main/crates/aptos) CLI. It includes tools that are too contentious for the core CLI, such as codegen based on the Move contract ABIs.

## Versioning

This CLI follows the version of the core Aptos CLI. In other words, if the version of the CLI is 7.1.2 in the revision of aptos-core we use a dependency, this CLI will also be 7.1.2. We make additional releases with dashes, e.g. 7.1.2-1.

## Code Generation

The CLI supports generating code for the structs in a Move module. Functions and enums are not supported right now.

### Generating Rust code

The tool takes the same args as `aptos move compile` plus some extra args related to code generation:
```
aptos-ext move generate rust --named-addresses addr=$ADDR --generate-to ../rust/src/generated
```

### Generating GraphQL schema

Under the hood the codegen works by converting the ABI into a GraphQL schema. You can do this step directly like this:
```
aptos-ext move generate schema --named-addresses addr=$ADDR --schema-path .
```

### Generating Python types

First generate the GraphQL schema, then run this:
```
poetry run python -m gql_schema_codegen -p schema.graphql -c config.yaml > /dev/null
```

This is obviously an abridged explanation, you'll have to install the necessary library.

### Generating TS types

It's possible but I suggest using [Surf](https://github.com/ThalaLabs/surf) instead.
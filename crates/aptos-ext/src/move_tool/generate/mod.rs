// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

mod rust;
mod schema;

use aptos::common::types::{CliCommand, CliError, CliResult, MovePackageOptions};
use aptos::move_tool::IncludedArtifactsArgs;
use anyhow::Result;
use aptos_api_types::MoveModule;
use aptos_framework::BuiltPackage;
use aptos_move_graphql_schema::{
    build_sdl, BuilderOptions, SchemaBuilderLocal, SchemaBuilderTrait,
};
use clap::Subcommand;

/// Generates schemas / code based on a Move module.
#[derive(Subcommand)]
pub enum GenerateTool {
    Rust(rust::GenerateRust),
    Schema(schema::GenerateSchema),
}

impl GenerateTool {
    pub async fn execute(self) -> CliResult {
        match self {
            Self::Rust(tool) => tool.execute_serialized().await,
            Self::Schema(tool) => tool.execute_serialized().await,
        }
    }
}

/// Build a Move package and generate a GraphQL schema from it for its types.
/// This returns the schema as a string in the GraphQL SDL.
pub fn build_schema_str(
    included_artifacts_args: &IncludedArtifactsArgs,
    move_options: &MovePackageOptions,
    builder_options: BuilderOptions,
) -> Result<String> {
    let mut build_options = included_artifacts_args
        .included_artifacts
        .build_options(move_options)
        .map_err(|e| CliError::UnexpectedError(format!("{:#}", e)))?;

    build_options.install_dir = move_options.output_dir.clone();
    build_options.with_abis = true;

    let package_dir = move_options.get_package_path()?;

    // Build the package.
    let package = BuiltPackage::build(package_dir.clone(), build_options)
        .map_err(|e| CliError::MoveCompilationError(format!("{:#}", e)))?;

    // Convert the modules into MoveModule.
    let modules = package
        .all_modules()
        .cloned()
        .map(MoveModule::from)
        .collect();

    // Build the Schema struct.
    let schema = SchemaBuilderLocal::new(builder_options)
        .add_modules(modules)
        .build()
        .map_err(|e| CliError::UnexpectedError(format!("Failed to build schema: {:#}", e)))?;

    Ok(build_sdl(&schema))
}

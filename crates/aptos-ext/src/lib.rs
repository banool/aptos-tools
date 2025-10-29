// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

#![deny(unsafe_code)]

pub mod move_tool;

use aptos::common::types::CliResult;
use clap::Parser;

/// Extended Aptos CLI with tools such as for code generation from Move modules.
#[derive(Parser)]
#[clap(name = "aptos-ext", author, version, propagate_version = true)]
pub enum Tool {
    #[clap(subcommand)]
    Move(MoveTool),
}

impl Tool {
    pub async fn execute(self) -> CliResult {
        use Tool::*;
        match self {
            Move(tool) => tool.execute().await,
        }
    }
}

/// Move-related commands.
#[derive(Parser)]
pub enum MoveTool {
    #[clap(subcommand)]
    Generate(move_tool::generate::GenerateTool),
}

impl MoveTool {
    pub async fn execute(self) -> CliResult {
        match self {
            MoveTool::Generate(tool) => tool.execute().await,
        }
    }
}

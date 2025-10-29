// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

pub mod generate;

// Re-export what we need from the aptos crate.
pub use aptos::move_tool::{register_package_hooks, IncludedArtifactsArgs};

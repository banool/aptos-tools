// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

//! aptos-ext is an extended tool for code generation from Aptos Move modules.

#![forbid(unsafe_code)]

use aptos_ext::{Tool, move_tool};
use clap::Parser;
use std::{process::exit, time::Duration};

fn main() {
    // Register hooks.
    move_tool::register_package_hooks();

    // Create a runtime.
    let runtime = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap();

    // Run the corresponding tool.
    let result = runtime.block_on(Tool::parse().execute());

    // Shutdown the runtime with a timeout. We do this to make sure that we don't sit
    // here waiting forever waiting for tasks that sometimes don't want to exit on
    // their own (e.g. telemetry, containers spawned by the localnet, etc).
    runtime.shutdown_timeout(Duration::from_millis(50));

    match result {
        Ok(inner) => println!("{inner}"),
        Err(inner) => {
            eprintln!("{inner}");
            exit(1);
        },
    }
}

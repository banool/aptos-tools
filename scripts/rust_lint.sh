#!/bin/bash

# This assumes you have already installed cargo-sort:
# cargo install cargo-sort@1.0.7

# Make sure we're in the root of the repo.
if [ ! -d ".cargo" ]
then
    echo "Please run this from the rust directory"
    exit 1
fi

# Run in check mode if requested.
CHECK_ARG=""
if [ "$1" = "--check" ]; then
    CHECK_ARG="--check"
fi

set -ex

cargo xclippy

cargo fmt $CHECK_ARG

# Once cargo-sort correctly handles workspace dependencies,
# we can move to cleaner workspace dependency notation.
# See: https://github.com/DevinR528/cargo-sort/issues/47
cargo sort --grouped --workspace $CHECK_ARG


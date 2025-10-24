#!/bin/bash

# Script to automatically handle drizzle-kit generate interactive prompts
# Selects "create table" option for all new tables

expect -c "
set timeout 300
spawn dotenv --file .env.local run pnpm db:generate

# Handle multiple table creation prompts
while {1} {
    expect {
        \"table created or renamed from another table?\" {
            send \"\r\"
            continue
        }
        \"✓ Your SQL migration file\" {
            break
        }
        eof {
            break
        }
        timeout {
            puts \"Timeout waiting for migration completion\"
            exit 1
        }
    }
}

expect eof
"
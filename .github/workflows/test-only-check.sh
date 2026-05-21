#!/bin/bash
cd $(dirname $(readlink -e $0))/../../
! git grep -E '\b(test|it|describe)\.only\(' -- '**/test*.js'

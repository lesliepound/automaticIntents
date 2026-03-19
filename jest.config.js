export default {
    transform: {
        "^.+\\.m?js$": "babel-jest",
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "/.claude/worktrees/",
    ],
}
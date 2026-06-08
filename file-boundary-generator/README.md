# File Boundary Generator

Generate upload-test boundary files.

Generated files are written to `outputs/`.

Supported scenarios:

- common upload formats
- empty files
- exact and near-limit file sizes
- corrupted/truncated files
- random binary files
- spoofed extension files
- long, Chinese, spaced, and special-character file names

Review generated files before using them against production systems.

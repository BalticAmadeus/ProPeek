## 1.4.3 (2026-02-25)

### Changed

- Listing files will now be read from 'Directory' attribute in profiler header
- Updated MUI components to match VSCode themes

### Added

- Telemetry data collection
- Number of calls information on flame graph nodes
- Number of nodes found information when searching in flame graph

## 1.4.2 (2025-07-14)

### Changed

- Fixed file paths to be compatible with all operating systems

## 1.4.1 (2025-06-12)

### Changed

- Fixed performance issues when opening big profiler files

## 1.4.0 (2024-11-12)

### Changed

- Double clicking module name will now highlight the correct module
- Various style changes to navigation buttons, progress bars, tree view etc.
- Fixed various small bugs

### Added

- Jump to code from flame graph using CTRL + left click
- Compare tab for comparison between two different profiler files
- Code view section in module details tab

## 1.3.0 (2024-04-08)

### Changed

- Fixed various small bugs.

### Added

- Open listing files.
- Time ribbon in flame graph.
- Commad to open profiler file.

## 1.2.0 (2024-02-07)

### Changed

- Selection now remains selected while switching between tabs
- Double clicking in flame graph will now open module details with the selection
- Fixed various small bugs

### Added

- Ability to toggle graph type
- Implemented double clicking on tree view, called modules, calling modules
- Implemented start time in flame graph

## 1.1.1 (2023-12-21)

### Changed

- Fixed various small bugs

## 1.1.0 (2023-11-10)

### Changed

- Fixed various small bugs

### Added

- Jump to code line
- Show % and total time on hover in flame graph

## 1.0.1 (2023-10-02)

### Added

- can open .out files
- processing of coverage data section

## Initial releases 1.0.0

### Added

- Load and view .prof profiler file
  - View Module details.
  - View Calling module details.
  - View Called module details.
  - View Line Summary.
- Treeview.
- Flamegraph.
  - Ability to sort out procedure names by text.
  - Ability to sort out by constructor and destructor.
- Profiler Start/Stop Snippets.

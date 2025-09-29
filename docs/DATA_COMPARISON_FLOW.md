# Data Comparison Plugin - Flow Logic

## 📊 Tổng quan Flow Logic

### 1. Main Menu Entry
```
execute() → showMainMenu() → startWizard()
```

### 2. Wizard Steps
```
1. Select File A (Reference) → readFile(fileA)
2. Select File B (Extraction) → readFile(fileB) 
3. Check Existing Config
4. Compare Data OR Use Config
5. Field Mapping (nếu manual)
6. Export CSV
7. Completion Menu
```

## 📋 Chi tiết từng bước

### Step 1: File Selection
- Đọc danh sách files .csv/.xlsx/.xls từ current directory
- Filter files available (loại trừ file đã chọn cho File A)
- Present cho user chọn qua inquirer

### Step 2: File Reading
- Detect file type by extension
- CSV: sử dụng csv-parser stream
- Excel: sử dụng XLSX library

### Step 3: Config Check
- Tìm file `data-comparison-config.json`
- Parse và display config info
- User có thể reuse config hoặc manual setup

### Step 4: Data Comparison
#### Manual Mode:
- Show columns của cả 2 files
- User input field numbers để compare
- Validate input với file structure
- Tạo comparison keys từ selected fields

#### Config Mode:
- Sử dụng pre-saved config
- Auto apply field selections
- Skip manual configuration

### Step 5: Comparison Logic
```typescript
// Tạo Set từ File A với comparison keys
const fileASet = new Set<string>();
dataA.rows.forEach(row => {
  const key = fileAFieldIndices.map(index => 
    String(row[dataA.headers[index]] || '')
  ).join('|');
  fileASet.add(key);
});

// Check matching trong File B
dataB.rows.forEach(row => {
  const key = fileBFieldIndices.map(index => 
    String(row[dataB.headers[index]] || '')
  ).join('|');
  
  if (fileASet.has(key)) {
    matchedRows.push(row);
  } else {
    unmatchedRows.push(row);
  }
});
```

### Step 6: Field Mapping (Manual only)
- Map từng field của File A với File B
- Tạo mapping object: `{ [fileAField]: fileBField }`

### Step 7: Export Options (NEW LOGIC)
- **Export Choice Dialog**: User chọn cách export sau khi mapping field
- **Option 1**: Export chỉ matched rows với File A structure
- **Option 2**: Export toàn bộ File B rows với File A structure
- Generate timestamped filenames với prefix khác biệt

#### New Export Functions:
```typescript
// Export matched rows only (existing behavior)
exportMatchedRows(matchedRows, fieldMapping, outputHeaders)

// Export ALL File B rows with File A structure (NEW)
exportAllFileBRows(allFileBRows, fieldMapping, outputHeaders)
```

#### Export File Naming:
- Matched only: `Export_result-{timestamp}.csv`
- All File B: `Export_AllFileB-{timestamp}.csv`

### Step 8: Completion
- User có thể start new comparison hoặc return main menu

## 🔄 Data Structures

### FileData Interface:
```typescript
interface FileData {
  headers: string[];
  rows: any[];
}
```

### ComparisonConfig Interface:
```typescript
interface ComparisonConfig {
  fileAFields: number[];
  fileBFields: number[];
  fieldMapping: { [key: string]: string };
  createdAt: string;
  description?: string;
}
```

### ComparisonResult Interface:
```typescript
interface ComparisonResult {
  matchedRows: any[];
  unmatchedRows: any[];
  fieldMapping: { [key: string]: string };
  fileAFields?: number[];
  fileBFields?: number[];
}
```

## 🎯 Core Algorithms

### 1. File Reading Algorithm:
- **CSV**: Streaming với csv-parser, parse từng row
- **Excel**: XLSX.readFile → sheet_to_json → transform thành object format

### 2. Comparison Algorithm:
- Tạo composite keys từ multiple fields
- Sử dụng Set để optimize lookup (O(1))
- Key format: "field1|field2|field3"

### 3. Mapping Algorithm:
- Preserve original File A structure
- Map File B fields theo mapping rules
- Export theo schema của File A

## 💾 Persistence & Configuration

### Config Save/Load:
- File: `data-comparison-config.json`
- Contains field selections và mapping rules
- Reusable cho các lần comparison tương tự

### Output Files:
- `Export_result-{timestamp}.csv`: Matched data với mapping
- `Unmatched_rows-{timestamp}.csv`: Unmatched data từ File B

## 🚀 Performance Considerations

1. **Streaming cho CSV**: Tránh load toàn bộ file vào memory
2. **Set-based comparison**: O(1) lookup thay vì O(n) linear search
3. **Batch processing**: Process all rows cùng lúc
4. **Memory efficient**: Không giữ duplicate data trong memory

## 🔧 Error Handling

- File format validation
- Field number validation  
- File existence checking
- CSV parsing error handling
- Config file parsing error handling

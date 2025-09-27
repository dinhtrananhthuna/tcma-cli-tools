# TCMA CLI Tools - Plugins Documentation

## Tổng quan

TCMA CLI Tools là một hệ thống plugin-based CLI được thiết kế để cung cấp các công cụ tiện ích cho team TCMA. Hệ thống sử dụng kiến trúc plugin modular, cho phép dễ dàng mở rộng và quản lý các tính năng.

## Kiến trúc Plugin

### BasePlugin Class

Tất cả các plugin đều kế thừa từ `BasePlugin` class, cung cấp các tính năng cơ bản:

```typescript
export abstract class BasePlugin implements Plugin {
  abstract name: string;
  abstract description: string;
  abstract commands: string[];
  abstract execute(command: string, args?: string[]): Promise<void>;
}
```

#### Tính năng có sẵn:
- **showPluginHeader()**: Hiển thị header với tiêu đề plugin
- **showPluginFooter()**: Hiển thị footer và chờ ESC để thoát
- **log()**: Ghi log với timestamp và màu sắc phù hợp
- **sleep()**: Utility để delay
- **showVersionInfo()**: Hiển thị thông tin phiên bản
- **showUpdateCommands()**: Hiển thị lệnh cập nhật

## Danh sách Plugin

### 1. Update Plugin

**Tên**: Update Tool  
**Mô tả**: Cập nhật TCMA CLI Tools lên phiên bản mới nhất  
**Commands**: `update`, `u`  
**File**: `src/plugins/update-plugin.ts`

#### Tính năng:
- Kiểm tra phiên bản hiện tại
- Kiểm tra cập nhật có sẵn
- Hiển thị hướng dẫn cập nhật
- Liệt kê các nguồn cập nhật (GitHub, NPM)

#### Cách sử dụng:
```bash
tcma update
# hoặc
tcma u
```

#### Các lệnh cập nhật:
- `npm install -g git+https://github.com/tcma-team/tcma-cli-tools.git`
- `npm update -g tcma-cli-tools`

---

### 2. Data Comparison Plugin

**Tên**: Data Comparison & Mapping Tool  
**Mô tả**: So sánh và ánh xạ dữ liệu giữa các file CSV/Excel, tìm bản ghi khớp và xuất kết quả  
**Commands**: `compare`, `data-compare`  
**File**: `src/plugins/data-comparison-plugin.ts`

#### Tính năng chính:

##### 1. **Wizard Interface**
- Giao diện wizard từng bước để hướng dẫn người dùng
- Clear console khi bắt đầu phiên làm việc mới
- Menu hoàn thành với tùy chọn bắt đầu so sánh mới

##### 2. **File Selection**
- Hỗ trợ file CSV và Excel (.xlsx, .xls)
- Chọn file tham chiếu (File A) và file trích xuất (File B)
- Hiển thị danh sách file có sẵn trong thư mục hiện tại

##### 3. **Data Comparison**
- So sánh dữ liệu giữa hai file dựa trên các trường được chọn
- Tìm các bản ghi khớp và không khớp
- Hiển thị thống kê chi tiết về kết quả so sánh

##### 4. **Field Mapping**
- Ánh xạ các trường từ File B sang File A
- Giao diện interactive để chọn mapping
- Lưu cấu hình mapping để sử dụng lại

##### 5. **Configuration Management**
- Lưu cấu hình so sánh vào file `data-comparison-config.json`
- Tự động phát hiện và sử dụng cấu hình có sẵn
- Hiển thị thông tin cấu hình (ngày tạo, mô tả, trường được chọn)

##### 6. **Export Functionality**
- Xuất kết quả khớp thành file CSV với timestamp
- Xuất các bản ghi không khớp (tùy chọn)
- Tên file tự động: `Export_result-YYYY-MM-DDTHH-MM-SS.csv`

#### Cách sử dụng:

```bash
tcma compare
# hoặc
tcma data-compare
```

#### Workflow:

1. **Chọn File A (Reference)**: File tham chiếu để so sánh
2. **Chọn File B (Extraction)**: File cần trích xuất dữ liệu
3. **Cấu hình So sánh**:
   - Sử dụng cấu hình có sẵn (nếu có)
   - Hoặc tạo cấu hình mới bằng cách chọn các trường so sánh
4. **Field Mapping**: Ánh xạ các trường từ File B sang File A
5. **Export**: Xuất kết quả thành file CSV

#### File Output:

- **Export_result-{timestamp}.csv**: File chứa các bản ghi khớp
- **Unmatched_rows-{timestamp}.csv**: File chứa các bản ghi không khớp (tùy chọn)
- **data-comparison-config.json**: File cấu hình để sử dụng lại

#### Cải tiến gần đây:

- ✅ **Clear Console**: Tự động clear console khi bắt đầu wizard mới
- ✅ **Session Management**: Mỗi phiên làm việc mới có giao diện sạch sẽ
- ✅ **File Preservation**: Giữ nguyên các file export cũ, chỉ clear terminal

---

## Plugin Manager

### PluginManager Class

Quản lý tất cả các plugin trong hệ thống:

```typescript
export class PluginManager {
  registerPlugin(plugin: Plugin): void
  getPlugin(name: string): Plugin | undefined
  getAllPlugins(): Plugin[]
}
```

### Đăng ký Plugin

Plugins được đăng ký trong `src/cli.ts`:

```typescript
const pluginManager = new PluginManager();
pluginManager.registerPlugin(new UpdatePlugin());
pluginManager.registerPlugin(new DataComparisonPlugin());
```

## Phát triển Plugin mới

### Tạo Plugin mới:

1. **Tạo file plugin** trong `src/plugins/`
2. **Kế thừa BasePlugin**:
   ```typescript
   export class MyPlugin extends BasePlugin {
     name = 'My Plugin Name';
     description = 'Plugin description';
     commands = ['my-command', 'mc'];
     
     async execute(command: string, args?: string[]): Promise<void> {
       // Implementation
     }
   }
   ```

3. **Đăng ký plugin** trong `src/cli.ts`
4. **Thêm vào menu** tự động

### Best Practices:

- Sử dụng `showPluginHeader()` và `showPluginFooter()`
- Sử dụng `log()` method cho logging
- Xử lý lỗi gracefully
- Cung cấp clear instructions cho người dùng
- Sử dụng chalk cho màu sắc và UI

## Cấu hình

### CLI Configuration

```typescript
export const CLI_CONFIG = {
  VERSION: '1.0.0',
  NAME: 'TCMA CLI Tools',
  DESCRIPTION: 'Development utilities for TCMA team - Code by Vu Dinh',
  REPOSITORY: 'https://github.com/tcma-team/tcma-cli-tools.git',
  NPM_PACKAGE: 'tcma-cli-tools',
  NPM_URL: 'https://www.npmjs.com/package/tcma-cli-tools'
}
```

## Dependencies

### Core Dependencies:
- `inquirer`: Interactive command line interface
- `chalk`: Terminal string styling
- `figlet`: ASCII art text
- `csv-parser`: CSV file parsing
- `csv-writer`: CSV file writing
- `xlsx`: Excel file handling

### Development Dependencies:
- `typescript`: TypeScript compiler
- `@types/*`: TypeScript type definitions

## Troubleshooting

### Common Issues:

1. **Plugin không hiển thị trong menu**: Kiểm tra đã đăng ký plugin trong `cli.ts`
2. **Lỗi import**: Kiểm tra đường dẫn import và export
3. **Permission errors**: Đảm bảo có quyền đọc/ghi file
4. **Console không clear**: Sử dụng `console.clear()` trong plugin

### Debug Tips:

- Sử dụng `log()` method để debug
- Kiểm tra console output
- Verify file permissions
- Test với sample data

---

## Changelog

### Version 1.0.0
- ✅ Initial release với Update Plugin
- ✅ Data Comparison Plugin với đầy đủ tính năng
- ✅ Plugin Manager system
- ✅ BasePlugin architecture
- ✅ Console clear functionality cho Data Comparison Plugin

---

*Tài liệu này được cập nhật lần cuối: $(date)*  
*Tác giả: Vu Dinh - TCMA Team*

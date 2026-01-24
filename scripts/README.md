# TypeScript Migration Scripts

Scripts to help convert your React Native project from JavaScript to TypeScript.

## 📜 Available Scripts

### 1. `convert-to-typescript.js`
Automatically converts `.js` and `.jsx` files to TypeScript.

**Features:**
- ✅ Auto-detects React components (converts to `.tsx`)
- ✅ Converts regular JS files to `.ts`
- ✅ Adds basic type annotations (`React.FC`, `useState<T>`, etc.)
- ✅ Creates backups (optional)
- ✅ Dry-run mode to preview changes

**Usage:**
```bash
# Preview changes (dry-run)
node scripts/convert-to-typescript.js --dry-run

# Convert files with backup
node scripts/convert-to-typescript.js --backup

# Convert files (no backup)
node scripts/convert-to-typescript.js

# Verbose mode
node scripts/convert-to-typescript.js --verbose
```

### 2. `update-imports.js`
Updates import statements after conversion.

**Features:**
- ✅ Updates `import` statements from `.js/.jsx` to `.ts/.tsx`
- ✅ Handles `require()` statements
- ✅ Smart detection of correct extension
- ✅ Dry-run mode

**Usage:**
```bash
# Preview changes
node scripts/update-imports.js --dry-run

# Update imports
node scripts/update-imports.js
```

## 🚀 Complete Migration Workflow

### Step 1: Backup your project
```bash
git add .
git commit -m "Before TypeScript migration"
```

### Step 2: Preview conversion
```bash
node scripts/convert-to-typescript.js --dry-run
```

### Step 3: Convert files
```bash
# With backup
node scripts/convert-to-typescript.js --backup

# Or without backup (if you trust git)
node scripts/convert-to-typescript.js
```

### Step 4: Update imports
```bash
node scripts/update-imports.js
```

### Step 5: Install TypeScript dependencies
```bash
npm install --save-dev typescript @types/react @types/react-native
```

### Step 6: Test your app
```bash
npm start
```

### Step 7: Fix type errors
- Open your IDE (VS Code recommended)
- Check for TypeScript errors (red squiggles)
- Add proper types where needed
- Run `npx tsc --noEmit` to check for type errors

## 📝 What gets converted?

### File Extensions
- `.js` → `.ts` (regular JavaScript)
- `.jsx` → `.tsx` (React components)
- `.js` with JSX → `.tsx` (auto-detected)

### Type Annotations Added

**React Components:**
```typescript
// Before
export const MyComponent = ({ name }) => { ... }

// After
export const MyComponent: React.FC<{ name }> = ({ name }) => { ... }
```

**useState:**
```typescript
// Before
const [count, setCount] = useState(0);

// After
const [count, setCount] = useState<number>(0);
```

## ⚠️ Manual Steps Required

After running the scripts, you'll need to manually:

1. **Add proper prop types**
   ```typescript
   interface Props {
     name: string;
     age: number;
     onPress: () => void;
   }
   
   export const MyComponent: React.FC<Props> = ({ name, age, onPress }) => {
     // ...
   }
   ```

2. **Type navigation props**
   ```typescript
   import { NativeStackNavigationProp } from '@react-navigation/native-stack';
   
   type RootStackParamList = {
     Home: undefined;
     Profile: { userId: string };
   };
   
   type Props = {
     navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
   };
   ```

3. **Type context values**
   ```typescript
   interface AuthContextType {
     user: User | null;
     login: (email: string, password: string) => Promise<void>;
     logout: () => void;
   }
   ```

4. **Fix any type errors**
   - Use VS Code's TypeScript language server
   - Run `npx tsc --noEmit` to check for errors
   - Add `// @ts-ignore` as a temporary workaround (not recommended)

## 🛠️ Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Import paths might need updating. Run `update-imports.js` again.

### Issue: Type errors everywhere
**Solution:** Start by adding `any` types, then gradually make them more specific:
```typescript
const props: any = { ... };  // Temporary
```

### Issue: React types not found
**Solution:**
```bash
npm install --save-dev @types/react @types/react-native
```

### Issue: Navigation types complex
**Solution:** Create a `types/navigation.ts` file:
```typescript
export type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  // ... all your screens
};
```

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [React Native TypeScript](https://reactnative.dev/docs/typescript)

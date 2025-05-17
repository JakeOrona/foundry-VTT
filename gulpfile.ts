const gulp = require('gulp');
const ts = require('gulp-typescript');
const project = ts.createProject('tsconfig.json');
const fs = require('fs');
const path = require('path');

// Get the module name from the package.json
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const moduleId = pkg.name;

// Get Foundry data path from command line arg
let foundryDataPath = process.env.FOUNDRY_DATA_PATH;
if (!foundryDataPath) {
    try {
        const configPath = path.resolve(process.cwd(), 'foundryconfig.json');
        const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
        foundryDataPath = config.dataPath;
    } catch (err) {
        console.error("Could not find foundryconfig.json");
    }
}

let destinationPath = '';
if (foundryDataPath) {
    destinationPath = path.join(foundryDataPath, 'modules', moduleId);
} else {
    console.warn('No Foundry data path found. Module will not be linked to Foundry.');
}

// Compile TypeScript
gulp.task('compile', () => {
    return gulp.src('src/**/*.ts')
        .pipe(project())
        .pipe(gulp.dest('dist/'))
});

// Copy other files
gulp.task('copy', async () => {
    return new Promise<void>((resolve, reject) => {
        gulp.src('README.md').pipe(gulp.dest("dist/"));
        gulp.src("src/module.json").pipe(gulp.dest('dist/'));
        gulp.src("src/lang/**").pipe(gulp.dest('dist/lang/'));
        gulp.src("src/templates/**").pipe(gulp.dest('dist/templates/'));
        gulp.src("src/styles/**").pipe(gulp.dest('dist/styles/'));
        gulp.src("src/assets/**").pipe(gulp.dest('dist/assets/'));
        resolve();
    });
});

// Build the project
gulp.task('build', gulp.parallel('compile', 'copy'));

// Link to Foundry Data path
gulp.task('link', () => {
    if (!destinationPath) {
        console.error('Foundry data path not configured. Create a foundryconfig.json or set FOUNDRY_DATA_PATH environment variable.');
        return Promise.reject(new Error('Foundry data path not configured'));
    }
    
    console.log(`Linking to ${destinationPath}`);
    
    // Ensure the destination directory exists
    if (!fs.existsSync(destinationPath)) {
        fs.mkdirSync(destinationPath, { recursive: true });
    }
    
    return gulp.src('dist/**/*')
        .pipe(gulp.dest(destinationPath));
});

// Watch for changes
gulp.task('watch', () => {
    gulp.watch('src/**/*.ts', gulp.series('compile'));
    gulp.watch(['src/**/*', '!src/**/*.ts'], gulp.series('copy'));
    
    if (destinationPath) {
        gulp.watch('dist/**/*', gulp.series('link'));
    }
});

// Default task
gulp.task('default', gulp.series('build'));
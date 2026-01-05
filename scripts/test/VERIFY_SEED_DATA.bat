@echo off
echo ================================
echo VERIFY DATABASE SEED RESULTS
echo ================================
echo.

cd /d "C:\Users\luaho\Demo project\v-edfinance\apps\api"

echo [Query 1] Count all users
call npx prisma db execute --stdin << EOF
SELECT COUNT(*) as user_count FROM "User";
EOF
echo.

echo [Query 2] List users by role
call npx prisma db execute --stdin << EOF
SELECT role, COUNT(*) as count FROM "User" GROUP BY role;
EOF
echo.

echo [Query 3] Count courses
call npx prisma db execute --stdin << EOF
SELECT COUNT(*) as course_count FROM "Course";
EOF
echo.

echo [Query 4] Count lessons
call npx prisma db execute --stdin << EOF
SELECT COUNT(*) as lesson_count FROM "Lesson";
EOF
echo.

echo [Query 5] Verify JSONB fields (course titles)
call npx prisma db execute --stdin << EOF
SELECT slug, title->>'vi' as title_vi, title->>'en' as title_en FROM "Course" LIMIT 3;
EOF
echo.

echo ================================
echo Open Prisma Studio to view data?
echo ================================
set /p open_studio="Open Prisma Studio? (Y/N): "

if /i "%open_studio%"=="Y" (
    echo Opening Prisma Studio...
    start npx prisma studio
    echo.
    echo Prisma Studio is running at: http://localhost:5555
    echo Press Ctrl+C in this window to stop it
)

echo.
pause

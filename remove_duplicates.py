# Remove duplicate ModerationLog and Achievement models from schema.prisma

schema_path = r'c:\Users\luaho\Demo project\v-edfinance\apps\api\prisma\schema.prisma'

# Read the schema file
with open(schema_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the first occurrence of "model ModerationLog"
first_moderation_line = None
second_moderation_line = None

for i, line in enumerate(lines):
    if 'model ModerationLog {' in line:
        if first_moderation_line is None:
            first_moderation_line = i
        else:
            second_moderation_line = i
            break

print(f'First ModerationLog at line {first_moderation_line + 1}')
print(f'Second ModerationLog at line {second_moderation_line + 1}')

# Find the end of the first Achievement model (which comes after first ModerationLog)
# We need to remove from first_moderation_line to just before second_moderation_line

# The second ModerationLog should be around line 349 (0-indexed: 348)
# We want to keep that one and remove the first one

# Find where first duplicate block ends (should be 2 blank lines before second occurrence)
end_of_first_duplicate = second_moderation_line - 1
while end_of_first_duplicate > first_moderation_line and lines[end_of_first_duplicate].strip() == '':
    end_of_first_duplicate -= 1
end_of_first_duplicate += 1  # Include the blank line

# Remove lines from first occurrence to just before second
new_lines = lines[:first_moderation_line] + lines[second_moderation_line:]

# Write back
with open(schema_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f'Removed lines {first_moderation_line + 1} to {end_of_first_duplicate}')
print('Duplicate models removed successfully!')

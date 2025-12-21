# Insert ModerationLog and Achievement models into schema.prisma

schema_path = r'c:\Users\luaho\Demo project\v-edfinance\apps\api\prisma\schema.prisma'
models_path = r'c:\Users\luaho\Demo project\v-edfinance\temp_prisma_models.txt'

# Read the schema file
with open(schema_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Read the models to insert
with open(models_path, 'r', encoding='utf-8') as f:
    models = f.read()

# Find insertion point
insert_index = content.find('enum BuddyGroupType')

if insert_index == -1:
    print('ERROR: Could not find insertion point')
    exit(1)

# Insert the models
new_content = content[:insert_index] + models + content[insert_index:]

# Write back
with open(schema_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Schema updated successfully!')
print('Added ModerationLog and Achievement models')

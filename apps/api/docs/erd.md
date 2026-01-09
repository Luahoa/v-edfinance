```mermaid
erDiagram

  "BuddyGroup" {

    }
  

  "BuddyMember" {

    }
  

  "BuddyChallenge" {

    }
  

  "SocialPost" {

    }
  

  "User" {

    }
  

  "Course" {

    }
  

  "Lesson" {

    }
  

  "UserProgress" {

    }
  

  "ChatThread" {

    }
  

  "ChatMessage" {

    }
  

  "BehaviorLog" {

    }
  

  "InvestmentProfile" {

    }
  

  "UserChecklist" {

    }
  

  "UserAchievement" {

    }
  

  "SystemSettings" {

    }
  

  "UserStreak" {

    }
  

  "RefreshToken" {

    }
  

  "VirtualPortfolio" {

    }
  

  "SimulationScenario" {

    }
  

  "SimulationCommitment" {

    }
  

  "ModerationLog" {

    }
  

  "Achievement" {

    }
  

  "UserRelationship" {

    }
  

  "OptimizationLog" {

    }
  

  "Quiz" {

    }
  

  "QuizQuestion" {

    }
  

  "QuizAttempt" {

    }
  

  "Certificate" {

    }
  

  "Transaction" {

    }
  
    "BuddyMember" }o--|| "BuddyGroup" : "group"
    "BuddyMember" }o--|| "User" : "user"
    "BuddyChallenge" }o--|| "BuddyGroup" : "group"
    "SocialPost" }o--|o "BuddyGroup" : "group"
    "SocialPost" }o--|| "User" : "user"
    "Lesson" }o--|| "Course" : "course"
    "UserProgress" }o--|| "Lesson" : "lesson"
    "UserProgress" }o--|| "User" : "user"
    "ChatThread" }o--|| "User" : "user"
    "ChatMessage" }o--|| "ChatThread" : "thread"
    "BehaviorLog" }o--|o "User" : "user"
    "InvestmentProfile" |o--|| "User" : "user"
    "UserChecklist" }o--|| "User" : "user"
    "UserAchievement" }o--|| "User" : "user"
    "UserStreak" |o--|| "User" : "user"
    "RefreshToken" }o--|| "User" : "user"
    "VirtualPortfolio" |o--|| "User" : "user"
    "SimulationScenario" }o--|| "User" : "user"
    "SimulationCommitment" }o--|| "User" : "user"
    "ModerationLog" }o--|| "User" : "user"
    "ModerationLog" }o--|o "User" : "moderator"
    "UserRelationship" }o--|| "User" : "follower"
    "UserRelationship" }o--|| "User" : "followed"
    "Quiz" }o--|| "Lesson" : "lesson"
    "QuizQuestion" }o--|| "Quiz" : "quiz"
    "QuizAttempt" }o--|| "User" : "user"
    "QuizAttempt" }o--|| "Quiz" : "quiz"
    "Certificate" }o--|| "User" : "user"
    "Certificate" }o--|| "Course" : "course"
    "Transaction" }o--|| "User" : "user"
    "Transaction" }o--|o "Course" : "course"
```

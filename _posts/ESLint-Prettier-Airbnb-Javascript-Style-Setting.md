---
title: 'ESLint와 Prettier를 사용하여 코드를 Airbnb 코딩 규칙을 적용하게 설정하는 방법'
date: '2021-05-13 22:44:38'
category: JavaScript
---

JavaScript에는 Airbnb, Google, jQuery, JavaScript Standard 등등 여러 가지 코딩 규칙(Coding Convention)이 있습니다.  
오늘은 이 많은 코딩 규칙 중에 ESLint와 Prettier를 사용하여 코드를 Airbnb 코딩 규칙 ([https://github.com/airbnb/javascript](https://github.com/airbnb/javascript))으로 적용하는 방법을소개하도록 하겠습니다.

## ESLint 설정 방법

1. Visual Studio Code를 실행하고, '확장 기능'에 들어가서 'ESLint'를 설치합니다.  
   ![Install ESLint](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_1.png)

2. NPM +5를 사용 중인 경우에는 `npx install-peerdeps --dev eslint-config-airbnb` 명령어로 패키지를추가합니다.  
   ![Install eslint-config-airbnb](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_2.png)

3. 아래와 같이 `devDependencies`에 6개의 패키지가 설치되면 정상적으로 설치된 것 입니다.

```json
"devDependencies": {
  "eslint": "^7.26.0",
  "eslint-config-airbnb": "^18.2.1",
  "eslint-plugin-import": "^2.23.1",
  "eslint-plugin-jsx-a11y": "^6.4.1",
  "eslint-plugin-react": "^7.23.2",
  "eslint-plugin-react-hooks": "^1.7.0"
}
```

4. 프로젝트 최상단에 `.eslintrc.yml` 파일을 생성하고 아래와 같이 입력합니다.

```yml
env:
  browser: true
  es6: true
  node: true
extends:
  - airbnb
```

5. 예시로 Airbnb 코딩 규칙에 어긋나는 코드를 아래와 같이 작성해보았습니다.  
   ![Bad Code](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_3.png)

6. 코드에 노란색 밑줄에 마우스를 올려놓으면 창이 하나 나타납니다. '빠른 수정...'을 클릭하고, 'ESLint: Manage Library Execution'를 클릭합니다.  
   ![Click ESLint: Manage Library Execution](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_4.png)

7. 아래와 같은 창이 나오면, 'Allow Everywhere'를 클릭합니다.  
   ![Click Allow Everywhere](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_5.png)

8. ESLint가 활성화되면, 아래와 같이 Airbnb 코딩 규칙에 어긋난 부분은 붉은색 밑줄로 표시됩니다. 붉은색 밑줄 위에 마우스 커서를 올리면 원인이 출력됩니다.  
   ![ESLint Airbnb](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_6.png)

## Prettier 설정 방법

1. Visual Studio Code를 실행하고, '확장 기능'에 들어가서 'Prettier'를 설치합니다.  
   ![ESLint Airbnb](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_7.png)

2. <kbd>Ctrl</kbd> + <kbd>,</kbd>를 눌러 설정에 들어갑니다.  
   'Default Formatter'를 검색하고, '없음'에서 'Prettier - Code formatter'로 변경합니다.  
   ![ESLint Airbnb](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_8.png)

3. 프로젝트 최상단에 `.prettierrc.yml` 파일을 생성하고 아래와 같이 입력합니다.  
   각 설정에 대한 설명은 아래에서 하도록 하겠습니다.

```yml
arrowParens: 'always'
bracketSpacing: true
jsxBracketSameLine: false
jsxSingleQuote: false
printWidth: 80
proseWrap: 'always'
quoteProps: 'as-needed'
semi: true
singleQuote: true
tabWidth: 2
trailingComma: 'es5'
useTabs: false
```

4. Airbnb 코딩 규칙을 적용할 코드를 열고 <kbd>F1</kbd>를 누른 뒤, 'Format Document'를 입력하고 실행합니다.  
   ![ESLint Airbnb](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_9.png)

5. 여기서 'Format Document'를 하면 아래와 같이 Airbnb 코딩 규칙에 맞게 적용되는 것을 확인할 수 있습니다.  
   **_(아래 사진의 붉은색 밑줄은 선언되지 않은 변수 또는 함수, 사용되지 않은 변수 때문에 붉은색 밑줄이 표시된 것입니다.)_**  
   ![Good Code](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_10.png)

6. 더 간편하게 사용하기 위해, <kbd>Ctrl</kbd> + <kbd>,</kbd>를 눌러 설정에 들어가서 'Format on Save' 를 검색하고 설정을 합니다.  
   'Format on Save'를 활성화를 하면 저장할 때 자동으로 Airbnb 코딩 규칙으로 변환되어 저장됩니다.  
   ![Good Code](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_11.png)

## Prettier 설정에 대한 설명

- `"quoteProps": "as-needed"` :  
  ![quoteProps](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_12.png)

- `"singleQuote": true` :  
  ![singleQuote](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_13.png)

- `"arrowParens": "always"` :  
  ![arrowParens](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_14.png)

- `"tabWidth": 2`, `"useTabs": false` :  
  ![tabWidth and useTabs](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_15.png)

- `"bracketSpacing": true` :  
  ![bracketSpacing](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_16.png)

- `"trailingComma": "es5"` :  
  ![trailingComma](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_17.png)

- `"semi": true` :  
  ![semi](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_18.png)

- `"jsxSingleQuote": false` :  
  ![jsxSingleQuote](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_19.png)

- `"jsxBracketSameLine": false` :  
  ![jsxBracketSameLine](/assets/image/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting/2021-05-13-ESLint-Prettier-Airbnb-Javascript-Style-Setting_20.png)

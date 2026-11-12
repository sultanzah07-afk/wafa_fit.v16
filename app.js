// WAFA FIT fresh shell; preserved feature and storage logic.

const STORAGE_KEY="wafaFitApp_v1";

let data={
 profile:null,date:todayKey(),foods:[],exercises:[],water:0,history:[],
 savedMeals:[],overLimitNotified:false
};
let profileEditMode=false;
let onboardingStep=1;

function todayKey(){
 const d=new Date();
 return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function dateLabel(key){
 const p=key.split("-");
 return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("ar-SA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function loadData(){
 try{
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved){
   const x=JSON.parse(saved);
   data={
    profile:x.profile||null,date:x.date||todayKey(),
    foods:Array.isArray(x.foods)?x.foods:[],
    exercises:Array.isArray(x.exercises)?x.exercises:[],
    water:Number(x.water)||0,
    history:Array.isArray(x.history)?x.history:[],
    savedMeals:Array.isArray(x.savedMeals)?x.savedMeals:[],
    overLimitNotified:Boolean(x.overLimitNotified)
   };
   if(data.profile){
    const p=data.profile;
    p.calorieGoal=p.calorieGoal||2000;
    p.waterGoal=p.waterGoal||2000;
    p.carbsGoal=p.carbsGoal??250;
    p.proteinGoal=p.proteinGoal??100;
    p.fatGoal=p.fatGoal??70;
   }
  }
 }catch(e){console.error(e)}
 checkNewDay();
}
function persist(){
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
 catch(e){showToast("تعذر حفظ البيانات في هذا الجهاز")}
}
function showToast(message){
 const el=document.getElementById("toast");
 el.textContent=message;el.style.display="block";
 clearTimeout(window.toastTimer);
 window.toastTimer=setTimeout(()=>el.style.display="none",3000);
}
function checkNewDay(){
 const today=todayKey();
 if(data.date!==today){
  if(data.date){
   data.history.unshift({
    date:data.date,calories:getTotalCalories(),water:data.water,
    burn:getTotalBurn(),foodCount:data.foods.length,
    exerciseCount:data.exercises.length,
    carbs:getMacroTotal("carbs"),protein:getMacroTotal("protein"),fat:getMacroTotal("fat")
   });
   data.history=data.history.slice(0,365);
  }
  data.date=today;data.foods=[];data.exercises=[];data.water=0;
  data.overLimitNotified=false;
  persist();
  if(data.profile)showToast("🌙 بدأ يوم جديد! تم حفظ سجل اليوم السابق.");
 }
}
function scheduleMidnight(){
 const now=new Date();
 const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1);
 setTimeout(()=>{checkNewDay();updateUI();scheduleMidnight()},Math.max(1000,next-now));
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){checkNewDay();updateUI()}});
window.addEventListener("pageshow",()=>{checkNewDay();updateUI()});

function showOnboarding(edit=false){
 profileEditMode=edit;
 document.getElementById("onboarding").style.display="block";
 document.getElementById("onboardTitle").textContent=edit?"تعديل ملفك الشخصي":"ابدأ رحلتك الصحية 💜";
 document.getElementById("onboardSubtitle").textContent=edit?"حدّث بياناتك وأهدافك اليومية.":"أنشئ ملفك الشخصي وحدد أهدافك اليومية لتخصيص تجربتك.";
 document.getElementById("cancelProfileButton").style.display=edit?"block":"none";
 document.getElementById("onboardError").style.display="none";
 const p=data.profile;
 const fields={
  profileName:p?.name||"",profileAge:p?.age||"",profileSex:p?.sex||"",
  profileHeight:p?.height||"",profileWeight:p?.weight||"",
  profileCalories:p?.calorieGoal||"",profileCarbs:p?.carbsGoal??"",
  profileProtein:p?.proteinGoal??"",profileFat:p?.fatGoal??"",
  profileWater:p?.waterGoal||""
 };
 Object.keys(fields).forEach(id=>document.getElementById(id).value=fields[id]);
 setOnboardingStep(1);
}
function setOnboardingStep(step){
 onboardingStep=step;
 document.getElementById("onboardStep1").style.display=step===1?"block":"none";
 document.getElementById("onboardStep2").style.display=step===2?"block":"none";
 document.getElementById("stepDot1").classList.toggle("active",step>=1);
 document.getElementById("stepDot2").classList.toggle("active",step>=2);
 document.getElementById("onboardError").style.display="none";
}
function onboardingError(message){
 const el=document.getElementById("onboardError");
 el.textContent=message;el.style.display="block";
}
function nextOnboarding(){
 const age=Number(document.getElementById("profileAge").value);
 const sex=document.getElementById("profileSex").value;
 const height=Number(document.getElementById("profileHeight").value);
 const weight=Number(document.getElementById("profileWeight").value);
 if(!Number.isInteger(age)||age<15||age>120){onboardingError("العمر المسموح لاستخدام التطبيق هو 15 سنة فأكثر.");return}
 if(!sex){onboardingError("يرجى اختيار الجنس.");return}
 if(!Number.isFinite(height)||height<100||height>250){onboardingError("تحقق من الطول.");return}
 if(!Number.isFinite(weight)||weight<20||weight>400){onboardingError("تحقق من الوزن.");return}
 setOnboardingStep(2);
}
function backOnboarding(){setOnboardingStep(1)}
function saveProfile(){
 const name=document.getElementById("profileName").value.trim();
 const age=Number(document.getElementById("profileAge").value);
 const sex=document.getElementById("profileSex").value;
 const height=Number(document.getElementById("profileHeight").value);
 const weight=Number(document.getElementById("profileWeight").value);
 const calorieGoal=Number(document.getElementById("profileCalories").value);
 const carbsGoal=Number(document.getElementById("profileCarbs").value);
 const proteinGoal=Number(document.getElementById("profileProtein").value);
 const fatGoal=Number(document.getElementById("profileFat").value);
 const waterGoal=Number(document.getElementById("profileWater").value);

 if(!Number.isInteger(age)||age<15||age>120){setOnboardingStep(1);onboardingError("العمر المسموح 15 سنة فأكثر.");return}
 if(!sex){setOnboardingStep(1);onboardingError("اختر الجنس.");return}
 if(!Number.isFinite(height)||height<100||height>250){setOnboardingStep(1);onboardingError("تحقق من الطول.");return}
 if(!Number.isFinite(weight)||weight<20||weight>400){setOnboardingStep(1);onboardingError("تحقق من الوزن.");return}
 if(!Number.isFinite(calorieGoal)||calorieGoal<1||calorieGoal>15000){setOnboardingStep(2);onboardingError("أدخل هدف سعرات صحيحًا.");return}
 if(!Number.isFinite(carbsGoal)||carbsGoal<0||carbsGoal>1500){setOnboardingStep(2);onboardingError("تحقق من هدف الكربوهيدرات.");return}
 if(!Number.isFinite(proteinGoal)||proteinGoal<0||proteinGoal>1500){setOnboardingStep(2);onboardingError("تحقق من هدف البروتين.");return}
 if(!Number.isFinite(fatGoal)||fatGoal<0||fatGoal>1500){setOnboardingStep(2);onboardingError("تحقق من هدف الدهون.");return}
 if(!Number.isFinite(waterGoal)||waterGoal<1||waterGoal>15000){setOnboardingStep(2);onboardingError("أدخل هدف ماء صحيحًا.");return}

 data.profile={name,age,sex,height,weight,calorieGoal,carbsGoal,proteinGoal,fatGoal,waterGoal};
 persist();
 document.getElementById("onboarding").style.display="none";
 profileEditMode=false;
 updateUI();
 showToast("تم حفظ ملفك وأهدافك بنجاح 💜");
}
function cancelProfileEdit(){
 document.getElementById("onboarding").style.display="none";
 profileEditMode=false;
}
function openProfile(){showOnboarding(true)}

function saveGoals(){
 const p=data.profile;
 if(!p)return;
 const calorieGoal=Number(document.getElementById("goalCalories").value);
 const carbsGoal=Number(document.getElementById("goalCarbs").value);
 const proteinGoal=Number(document.getElementById("goalProtein").value);
 const fatGoal=Number(document.getElementById("goalFat").value);
 const waterGoal=Number(document.getElementById("goalWater").value);
 if(!Number.isFinite(calorieGoal)||calorieGoal<1||calorieGoal>15000){showToast("تحقق من هدف السعرات");return}
 if(!Number.isFinite(carbsGoal)||carbsGoal<0||carbsGoal>1500){showToast("تحقق من الكربوهيدرات");return}
 if(!Number.isFinite(proteinGoal)||proteinGoal<0||proteinGoal>1500){showToast("تحقق من البروتين");return}
 if(!Number.isFinite(fatGoal)||fatGoal<0||fatGoal>1500){showToast("تحقق من الدهون");return}
 if(!Number.isFinite(waterGoal)||waterGoal<1||waterGoal>15000){showToast("تحقق من هدف الماء");return}
 Object.assign(p,{calorieGoal,carbsGoal,proteinGoal,fatGoal,waterGoal});
 data.overLimitNotified=false;
 persist();updateUI();showToast("تم تحديث أهدافك اليومية 💜");
}
function switchPage(page){
 checkNewDay();
 document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
 document.getElementById(page).classList.add("active");
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));
 const btn=document.querySelector('[data-page="'+page+'"]');
 if(btn)btn.classList.add("active");
 document.querySelector(".content").scrollTop=0;
 if(page==="settings"&&data.profile){
  const p=data.profile;
  document.getElementById("goalCalories").value=p.calorieGoal;
  document.getElementById("goalCarbs").value=p.carbsGoal;
  document.getElementById("goalProtein").value=p.proteinGoal;
  document.getElementById("goalFat").value=p.fatGoal;
  document.getElementById("goalWater").value=p.waterGoal;
 }
 updateUI();
}

function getTotalCalories(){return data.foods.reduce((s,x)=>s+Number(x.calories||0),0)}
function getTotalBurn(){return data.exercises.reduce((s,x)=>s+Number(x.calories||0),0)}
function getMacroTotal(key){return data.foods.reduce((s,x)=>s+Number(x[key]||0),0)}

function checkCalorieLimit(calories){
 if(!data.profile)return;
 const goal=Number(data.profile.calorieGoal)||0;
 const alertBox=document.getElementById("limitAlert");
 if(goal>0&&calories>goal){
  const excess=calories-goal;
  alertBox.style.display="block";
  document.getElementById("limitAlertText").textContent=
   "تجاوز مجموع ما سجلته هدفك بمقدار "+excess.toLocaleString("ar-SA")+" سعرة. هذا تنبيه للمقارنة مع هدفك المدخل فقط، وليس تقييمًا طبيًا لاحتياج جسمك.";
  if(!data.overLimitNotified){
   data.overLimitNotified=true;persist();
   setTimeout(()=>showToast("⚠️ تجاوزت هدف السعرات المسجل بـ "+excess+" سعرة"),200);
  }
 }else{
  alertBox.style.display="none";
  if(goal>0&&calories<=goal)data.overLimitNotified=false;
 }
}

function foodEmoji(name){
 if(name.includes("تفاح"))return "🍎";
 if(name.includes("موز"))return "🍌";
 if(name.includes("دجاج"))return "🍗";
 if(name.includes("رز")||name.includes("أرز"))return "🍚";
 if(name.includes("خبز"))return "🍞";
 if(name.includes("بيض"))return "🥚";
 if(name.includes("حليب"))return "🥛";
 if(name.includes("سلط"))return "🥗";
 if(name.includes("سمك"))return "🐟";
 if(name.includes("شوفان"))return "🥣";
 return "🍽️";
}
function readFoodForm(){
 const name=document.getElementById("foodName").value.trim();
 const calories=Number(document.getElementById("foodCalories").value);
 const carbs=Number(document.getElementById("foodCarbs").value||0);
 const protein=Number(document.getElementById("foodProtein").value||0);
 const fat=Number(document.getElementById("foodFat").value||0);
 const meal=document.getElementById("foodMeal").value;
 if(!name)return {error:"اكتب اسم الوجبة"};
 if(!Number.isFinite(calories)||calories<0)return {error:"أدخل سعرات صحيحة"};
 if(![carbs,protein,fat].every(v=>Number.isFinite(v)&&v>=0&&v<=1500))return {error:"تحقق من قيم الماكروز"};
 return {name,calories,carbs,protein,fat,meal,emoji:foodEmoji(name)};
}
function clearFoodForm(){
 ["foodName","foodCalories","foodCarbs","foodProtein","foodFat"].forEach(id=>document.getElementById(id).value="");
 document.getElementById("saveFoodToLibrary").checked=false;
}
function addFood(){
 const meal=readFoodForm();
 if(meal.error){showToast(meal.error);return}
 const item={...meal,id:Date.now(),time:new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})};
 data.foods.unshift(item);
 if(document.getElementById("saveFoodToLibrary").checked)saveMealToLibrary(meal);
 clearFoodForm();
 persist();updateUI();showToast("تم تسجيل الوجبة 🍽️");
}
function saveMealToLibrary(meal){
 const exists=data.savedMeals.some(x=>x.name.trim().toLowerCase()===meal.name.trim().toLowerCase()&&
  Number(x.calories)===Number(meal.calories)&&Number(x.carbs)===Number(meal.carbs)&&
  Number(x.protein)===Number(meal.protein)&&Number(x.fat)===Number(meal.fat));
 if(exists){showToast("هذه الوجبة موجودة مسبقًا في سجل وجباتك");return}
 data.savedMeals.unshift({
  id:Date.now()+Math.floor(Math.random()*10000),
  name:meal.name,calories:meal.calories,carbs:meal.carbs,
  protein:meal.protein,fat:meal.fat,meal:meal.meal,emoji:meal.emoji,
  savedAt:new Date().toISOString()
 });
 persist();
}
function addSavedMeal(id){
 const saved=data.savedMeals.find(x=>x.id===id);
 if(!saved)return;
 data.foods.unshift({...saved,id:Date.now(),time:new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})});
 persist();updateUI();showToast("تمت إضافة الوجبة المحفوظة إلى سجل اليوم 💜");
}
function updateSavedMealType(id,mealType){
 const allowedMeals=["الفطور","الغداء","العشاء","وجبة خفيفة"];
 if(!allowedMeals.includes(mealType))return;
 const saved=data.savedMeals.find(x=>Number(x.id)===Number(id));
 if(!saved)return;
 saved.meal=mealType;
 persist();
 showToast("تم تحديث نوع الوجبة إلى "+mealType+" 💜");
}
function deleteSavedMeal(id){
 if(!confirm("هل تريد حذف هذه الوجبة من سجل وجباتك المحفوظة نهائيًا؟"))return;
 data.savedMeals=data.savedMeals.filter(x=>Number(x.id)!==Number(id));
 persist();
 updateUI();
 showToast("تم حذف الوجبة من سجل المحفوظات");
}
function renderSavedMeals(){
 const target=document.getElementById("savedMealsList");
 document.getElementById("savedCount").textContent=data.savedMeals.length+" وجبة";
 if(!data.savedMeals.length){
  target.innerHTML='<div class="card empty-state"><div>📚</div>لم تحفظ أي وجبات بعد.<br>فعّل خيار الحفظ عند تسجيل وجبة جديدة لتظهر هنا دائمًا.</div>';
  return;
 }
 target.innerHTML=data.savedMeals.map(x=>`
  <div class="saved-meal-card">
   <div class="saved-meal-top"><strong>${x.emoji||"🍽️"} ${escapeHTML(x.name)}</strong><span>${Number(x.calories)} سعرة</span></div>
   <div class="macro-grid">
    <div class="macro-box carbs"><span>كربوهيدرات</span><strong>${Number(x.carbs)||0} جم</strong></div>
    <div class="macro-box protein"><span>بروتين</span><strong>${Number(x.protein)||0} جم</strong></div>
    <div class="macro-box fat"><span>دهون</span><strong>${Number(x.fat)||0} جم</strong></div>
    <div class="macro-box cal"><span>السعرات</span><strong>${Number(x.calories)||0}</strong></div>
   </div>
   <div class="saved-meal-type">
    <label for="savedMealType-${Number(x.id)}">نوع الوجبة</label>
    <select id="savedMealType-${Number(x.id)}" onchange="updateSavedMealType(${Number(x.id)},this.value)">
     <option value="الفطور" ${x.meal==="الفطور"?"selected":""}>الفطور</option>
     <option value="الغداء" ${x.meal==="الغداء"?"selected":""}>الغداء</option>
     <option value="العشاء" ${x.meal==="العشاء"?"selected":""}>العشاء</option>
     <option value="وجبة خفيفة" ${x.meal==="وجبة خفيفة"?"selected":""}>وجبة خفيفة</option>
    </select>
   </div>
   <div class="saved-meal-actions">
    <button class="primary-btn" onclick="addSavedMeal(${Number(x.id)})">＋ أضف إلى اليوم</button>
    <button class="danger-btn" onclick="deleteSavedMeal(${Number(x.id)})">🗑️ حذف من المحفوظات</button>
   </div>
  </div>`).join("");
}
function deleteFood(id){
 data.foods=data.foods.filter(x=>x.id!==id);
 persist();updateUI();showToast("تم حذف الوجبة من سجل اليوم");
}
function addWater(amount){data.water+=amount;persist();updateUI();showToast("تم تسجيل الماء 💧")}
function removeWater(amount){data.water=Math.max(0,data.water-amount);persist();updateUI();showToast("تم تعديل الماء")}

function getBurnEstimate(){
 const weight=Number(data.profile.weight);
 const met=Number(document.getElementById("exerciseType").value);
 const minutes=Number(document.getElementById("exerciseMinutes").value);
 if(!Number.isFinite(minutes)||minutes<=0||minutes>600)return null;
 const calories=(met*3.5*weight/200)*minutes;
 return {calories:Math.round(calories),minutes,met,weight,intensity:met<4?"خفيفة":met<7?"متوسطة":"عالية"};
}
function previewBurn(){
 const result=getBurnEstimate();
 const box=document.getElementById("burnPreview");
 if(!result){showToast("أدخل مدة تمرين صحيحة");return}
 box.style.display="block";
 box.textContent="الحرق التقديري: "+result.calories+" سعرة تقريبًا. شدة النشاط: "+result.intensity+". الحساب تقريبي وليس قياسًا مباشرًا.";
}
function addExercise(){
 const result=getBurnEstimate();
 if(!result){showToast("أدخل مدة تمرين صحيحة");return}
 const select=document.getElementById("exerciseType");
 data.exercises.unshift({
  id:Date.now(),name:select.options[select.selectedIndex].text,
  minutes:result.minutes,calories:result.calories,intensity:result.intensity,
  time:new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})
 });
 document.getElementById("exerciseMinutes").value="";
 document.getElementById("burnPreview").style.display="none";
 persist();updateUI();showToast("تم تسجيل النشاط الرياضي 🏃");
}
function deleteExercise(id){
 data.exercises=data.exercises.filter(x=>x.id!==id);
 persist();updateUI();showToast("تم حذف النشاط");
}
function escapeHTML(value){
 return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function renderFoods(targetId,limit=Infinity){
 const target=document.getElementById(targetId);
 const foods=data.foods.slice(0,limit);
 if(!foods.length){
  target.innerHTML='<div class="empty-state"><div>🍽️</div>لا توجد وجبات مسجلة اليوم</div>';return;
 }
 target.innerHTML=foods.map(food=>`
  <div class="food-item">
   <div class="food-emoji">${food.emoji||"🍽️"}</div>
   <div class="food-details"><strong>${escapeHTML(food.name)}</strong><span>${escapeHTML(food.meal||"وجبة")} · ${escapeHTML(food.time||"")}</span></div>
   <div class="food-calories">${Number(food.calories)} سعرة</div>
   ${targetId==="foodList"?`<button class="delete-btn" onclick="deleteFood(${Number(food.id)})">✕</button>`:""}
  </div>
  <div class="macro-grid" style="margin-top:-4px;margin-bottom:5px">
   <div class="macro-box carbs"><span>كربوهيدرات</span><strong>${Number(food.carbs)||0} جم</strong></div>
   <div class="macro-box protein"><span>بروتين</span><strong>${Number(food.protein)||0} جم</strong></div>
   <div class="macro-box fat"><span>دهون</span><strong>${Number(food.fat)||0} جم</strong></div>
   <div class="macro-box cal"><span>السعرات</span><strong>${Number(food.calories)||0}</strong></div>
  </div>`).join("");
}
function renderExercises(){
 const target=document.getElementById("exerciseList");
 if(!data.exercises.length){target.innerHTML='<div class="empty-state"><div>🏃</div>لم تسجل أي نشاط اليوم</div>';return}
 target.innerHTML=data.exercises.map(x=>`
  <div class="activity-row">
   <div class="activity-left"><div class="activity-icon">🏃</div><div><strong>${escapeHTML(x.name)}</strong><small>${Number(x.minutes)} دقيقة · ${escapeHTML(x.time||"")} · شدة ${escapeHTML(x.intensity||"")}</small></div></div>
   <div style="display:flex;align-items:center;gap:8px"><div class="activity-cal">≈ ${Number(x.calories)} سعرة</div><button class="delete-btn" onclick="deleteExercise(${Number(x.id)})">✕</button></div>
  </div>`).join("");
}
function renderMacroProgress(){
 const p=data.profile;
 const items=[
  {key:"carbs",name:"الكربوهيدرات",icon:"🍞",color:"#ffbb70",goal:p.carbsGoal},
  {key:"protein",name:"البروتين",icon:"🥩",color:"#55d6a1",goal:p.proteinGoal},
  {key:"fat",name:"الدهون",icon:"🥑",color:"#72b9ff",goal:p.fatGoal}
 ];
 document.getElementById("macroProgress").innerHTML=items.map(x=>{
  const total=getMacroTotal(x.key);
  const pct=x.goal>0?Math.min(total/x.goal*100,100):0;
  return `<div class="macro-progress-card">
   <div class="macro-progress-head"><strong>${x.icon} ${x.name}</strong><span>${total} / ${x.goal} جم</span></div>
   <div class="macro-track"><div class="macro-fill" style="width:${pct}%;background:${x.color}"></div></div>
  </div>`;
 }).join("");
}
function renderChart(){
 const meals=["الفطور","الغداء","العشاء","وجبة خفيفة"];
 const totals=meals.map(m=>data.foods.filter(f=>f.meal===m).reduce((s,f)=>s+Number(f.calories||0),0));
 const max=Math.max(...totals,100);
 document.getElementById("mealChart").innerHTML=meals.map((m,i)=>`
  <div class="bar-column"><div class="bar-value">${totals[i]}</div><div class="bar" style="height:${Math.max(4,totals[i]/max*100)}%"></div><div class="bar-label">${m}</div></div>`).join("");
}
function renderHistory(){
 const target=document.getElementById("historyList");
 if(!data.history.length){target.innerHTML='<div class="card empty-state"><div>📅</div>ستظهر هنا الأيام السابقة بعد أول يوم مكتمل.</div>';return}
 target.innerHTML=data.history.map(day=>`
  <div class="history-item">
   <strong>📅 ${dateLabel(day.date)}</strong><br>
   🍽️ السعرات: ${Number(day.calories||0)}<br>
   🍞 الكربوهيدرات: ${Number(day.carbs||0)} جم<br>
   🥩 البروتين: ${Number(day.protein||0)} جم<br>
   🥑 الدهون: ${Number(day.fat||0)} جم<br>
   💧 الماء: ${Number(day.water||0)} مل<br>
   🏃 الأنشطة: ${Number(day.exerciseCount||0)}<br>
   🔥 حرق النشاط التقديري: ${Number(day.burn||0)} سعرة
  </div>`).join("");
}
function updateUI(){
 if(!data.profile)return;
 const p=data.profile;
 const calories=getTotalCalories(),burn=getTotalBurn();
 const carbs=getMacroTotal("carbs"),protein=getMacroTotal("protein"),fat=getMacroTotal("fat");

 document.getElementById("welcomeName").textContent="أهلًا "+(p.name||"بك")+" 💜";
 document.getElementById("homeCalories").textContent=calories.toLocaleString("ar-SA");
 document.getElementById("calorieTargetText").textContent="هدفك اليومي "+p.calorieGoal.toLocaleString("ar-SA")+" سعرة";
 const pct=calories/p.calorieGoal*100;
 document.getElementById("calorieProgress").style.width=Math.min(pct,100)+"%";
 document.getElementById("calorieRemaining").textContent=calories>p.calorieGoal?"تجاوزت الهدف بـ "+(calories-p.calorieGoal):"المتبقي: "+(p.calorieGoal-calories);
 document.getElementById("caloriePercent").textContent=Math.round(pct)+"%";
 document.getElementById("dailyDate").textContent=new Date().toLocaleDateString("ar-SA",{weekday:"long",day:"numeric",month:"long"});
 document.getElementById("homeCarbs").textContent=carbs;
 document.getElementById("homeProtein").textContent=protein;
 document.getElementById("homeFat").textContent=fat;
 document.getElementById("homeWater").textContent=data.water.toLocaleString("ar-SA");
 document.getElementById("waterProgressText").textContent=data.water.toLocaleString("ar-SA");
 document.getElementById("waterGoalText").textContent="هدفك "+p.waterGoal+" مل";
 document.getElementById("waterProgress").style.width=Math.min(data.water/p.waterGoal*100,100)+"%";
 document.getElementById("homeExercise").textContent=burn;
 document.getElementById("homeExerciseCount").textContent=data.exercises.length;
 document.getElementById("foodTotalLabel").textContent=data.foods.length+" وجبة";
 checkCalorieLimit(calories);

 const profileHTML=`
  <div class="activity-row"><span>العمر</span><strong>${p.age} سنة</strong></div>
  <div class="activity-row"><span>الجنس</span><strong>${p.sex==="male"?"ذكر":"أنثى"}</strong></div>
  <div class="activity-row"><span>الطول</span><strong>${p.height} سم</strong></div>
  <div class="activity-row"><span>الوزن</span><strong>${p.weight} كجم</strong></div>`;
 document.getElementById("settingsProfile").innerHTML=profileHTML;

 document.getElementById("exerciseProfile").textContent=
  "يعتمد تقدير الحرق على وزن "+p.weight+" كجم ونوع النشاط ومدته. النتائج تقريبية وليست قياسًا طبيًا.";

 document.getElementById("statsFoods").textContent=data.foods.length;
 document.getElementById("statsWater").textContent=data.water;
 document.getElementById("statsExercises").textContent=data.exercises.length;
 document.getElementById("statsBurn").textContent=burn;
 document.getElementById("statsMacros").innerHTML=`
  <div class="activity-row"><span>🍞 الكربوهيدرات</span><strong>${carbs} / ${p.carbsGoal} جم</strong></div>
  <div class="activity-row"><span>🥩 البروتين</span><strong>${protein} / ${p.proteinGoal} جم</strong></div>
  <div class="activity-row"><span>🥑 الدهون</span><strong>${fat} / ${p.fatGoal} جم</strong></div>
  <div class="activity-row"><span>🔥 السعرات</span><strong>${calories} / ${p.calorieGoal}</strong></div>`;
 renderFoods("homeFoodList",3);
 renderFoods("foodList");
 renderSavedMeals();
 renderExercises();
 renderMacroProgress();
 renderChart();
 renderHistory();
}

function askCoach(){
 const q=document.getElementById("coachQuestion").value.trim();
 if(!q){showToast("اكتب سؤالك أولًا");return}
 const t=q.toLowerCase();
 let answer="حافظ على التنوع الغذائي والنوم الجيد والحركة المناسبة. هذه معلومات عامة وليست تشخيصًا طبيًا. 💜";
 if(t.includes("ماء"))answer="الماء يساعد على ترطيب الجسم. وزّع شرب الماء خلال اليوم، ولا تعتبر الهدف الرقمي بديلًا عن احتياج جسمك الفعلي.";
 else if(t.includes("وجبة")||t.includes("غذاء")||t.includes("أكل"))answer="الوجبة المتوازنة قد تضم خضارًا أو فواكه، ومصدر بروتين، ونشويات مناسبة. لا تعتمد على الحرمان أو حذف مجموعات غذائية.";
 else if(t.includes("رياضة")||t.includes("حركة")||t.includes("مشي"))answer="ابدأ بنشاط يناسب قدرتك، وزد المدة تدريجيًا. توقف عند الألم أو الدوخة أو ضيق النفس غير المعتاد.";
 else if(t.includes("نوم"))answer="النوم المنتظم يدعم التركيز والطاقة والصحة. حاول الحفاظ على موعد نوم واستيقاظ منتظم.";
 else if(t.includes("وزن")||t.includes("تنحيف")||t.includes("سعرات"))answer="تتغير احتياجات الطاقة حسب العمر والنمو والنشاط والصحة. خصوصًا لمن هم دون 18 سنة، تجنب خفض السعرات دون إشراف مختص.";
 else if(t.includes("بروتين"))answer="البروتين عنصر مهم لبناء وإصلاح أنسجة الجسم. يتوفر في البيض واللحوم والأسماك والحليب والبقوليات. تختلف الاحتياجات حسب العمر والنشاط والحالة الصحية.";
 else if(t.includes("كارب")||t.includes("كربوهيدرات"))answer="الكربوهيدرات مصدر مهم للطاقة، وتوجد في الأرز والخبز والشوفان والفواكه. اختر مصادر متنوعة ولا تحذفها من غذائك دون سبب طبي.";
 else if(t.includes("دهون"))answer="الدهون عنصر غذائي مهم، وتوجد في زيت الزيتون والمكسرات والأفوكادو والأسماك. الجسم يحتاج إلى الدهون ضمن غذاء متوازن.";
 const box=document.getElementById("coachResponse");
 box.style.display="block";box.textContent=answer;
}
function quickQuestion(q){document.getElementById("coachQuestion").value=q;askCoach()}

function exportData(){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="Wafa-Fit-Data.json";a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
 showToast("تم تجهيز ملف البيانات");
}
function resetAll(){
 if(!confirm("سيتم حذف بيانات اليوم والسجل السابق فقط. الوجبات المحفوظة وملفك الشخصي سيبقيان. هل تريد المتابعة؟"))return;
 data.foods=[];data.exercises=[];data.water=0;data.history=[];
 data.date=todayKey();data.overLimitNotified=false;
 persist();updateUI();showToast("تم حذف سجلات الأيام، والوجبات المحفوظة ما زالت موجودة");
}

loadData();
if(!data.profile){showOnboarding(false)}
else{document.getElementById("onboarding").style.display="none";updateUI()}
scheduleMidnight();

// تسجيل Service Worker لتوفير ملفات التطبيق بعد أول زيارة (يتطلب HTTPS).
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(err){ console.warn('SW registration failed:', err); });
  });
}
